import { type } from 'os';
import {CalculateDistance, Vector3, ArrayToVec3, Wait, SplitSpaces, IsJson, Fetch, Execute} from './s_lb';

let ESX; let Vehicles = [], InProgress;
emit('esx:getSharedObject', obj => (ESX = obj));

const GetVehicles = async() => {
     await Wait(2000);
     const result = await Fetch('SELECT * FROM mx_vehicles', {});
     Vehicles = result && [result].length > 0 && JSON.parse(JSON.stringify(result)) || {};
};
GetVehicles()

const SpawnVehicles = async() => {
     let closestplayerid, spawnlist = [];
     for (const veh of Vehicles) {
          if  ((veh && veh.data && veh.data.props) && !veh.entity || !DoesEntityExist(veh.entity)) {
               veh.data = IsJson(veh.data) && JSON.parse(veh.data) || veh.data
               if (!await GetEntityFromPlate(veh.data.props.plate)) {
                    if (await GetClosestPlayer(IsJson(veh.data) && JSON.parse(veh.data).coords || veh.data.coords, 400)) {
                         closestplayerid = await GetClosestPlayer(IsJson(veh.data) && JSON.parse(veh.data).coords || veh.data.coords, 400)
                         spawnlist.push({
                              veh_data: veh.data,
                              player_id: closestplayerid
                         })
                    }
               }else {
                    veh.entity = await GetEntityFromPlate(veh.data.props.plate)
               }
          }
     }
     if (spawnlist.length > 0) {
          if (closestplayerid && GetPlayerPed(closestplayerid) > 0) {
               emitNet('mx-vehiclekey:SpawnVehicles', closestplayerid, spawnlist);
               InProgress = true;
          }
     }
     let wait = 0
     while (true) {
          await Wait(1000);
          if (wait > 5000 || !InProgress) {break}
          wait+1000
     }
     await Wait(2000)
}

onNet('mx-vehiclekey:SpawnedVehicles', async(data) => {
     const src = (global as any).source
     for (let i = 0; i < data.length; i++) {
          if (data[i].veh_data.impound) {
               const result = await Fetch('SELECT * FROM owned_vehicles WHERE vehicle LIKE @plate', {['@plate']: '%' + data[i].veh_data.props.plate + '%'})
               if (result && result[0]) {
                    CreateNewkey(src, {props: {
                         plate: data[i].veh_data.props.plate
                    }})   
                    await AddNewVehicle(src, data[i].veh_data);
                    await Execute(`DELETE FROM owned_vehicles WHERE vehicle LIKE '%${data[i].veh_data.props.plate}%'`, {})
               }
          }
          await SetSpawned(data[i].veh_data.props.plate);
     }
     InProgress = null;
});

ESX.RegisterServerCallback('mx-vehiclekey:GetImpounds', async(source, cb) => {
     const player = ESX.GetPlayerFromId(source);
     const result = await Fetch(`SELECT * FROM owned_vehicles WHERE owner = '${player.identifier}'`, {})
     if ([result].length != 0) {
          cb(JSON.parse(JSON.stringify(result)))
     }else {
          cb(null)
     }
});

onNet('mx-vehiclekey:TakeImpound', function (data) {
     const src = (global as any).source
     const player = ESX.GetPlayerFromId(src)
     if (player) {
         if (player.getMoney() >= 250) {
               player.removeMoney(250)
               const veri = [
                    {
                         veh_data : {
                              props: data.props,
                              coords: {
                                  x: 491.09,
                                  y: -1313.07,
                                  z: 29.26,
                                  h: 299.74
                              },
                              impound: true
                         }
                    }
               ]
               emitNet('mx-vehiclekey:SpawnVehicles', src, veri)          
         }else {
               player.showNotification("you don't have enough money")
         }
     }
})
const SetSpawned = async(plate:String) => {
     for (const veh of Vehicles) {
          if (veh && veh.data && veh.data.props) {
               veh.data = IsJson(veh.data) && JSON.parse(veh.data) || veh.data;
               if (veh.data.props.plate === plate) {
                    veh.entity = await GetEntityFromPlate(plate)
                    break
               }
          }
     }
}

onNet('mx-vehiclekey:AddVehicle', async(data) => {
     const src = (global as any).source
     AddNewVehicle(src, data);
});

const AddNewVehicle = async(source, data) => {
     const src = source
     if (data && data.props) {
          try {
               const owner = ESX.GetPlayerFromId(src).identifier
               await Execute('INSERT INTO mx_vehicles (owner, data) VALUES (@owner, @data)', {
                    ['@owner']: owner,
                    ['@data']: JSON.stringify(data)
               })
               const result = await Fetch("SELECT id FROM mx_vehicles WHERE data LIKE @plate", {
                    ['@plate']: '%' + data.props.plate + '%'
               })
               Vehicles.push({
                    owner: owner,
                    data: data,
                    id: result[0].id
               })
               CreateNewkey(src, data);
          }catch(err) {
               console.log('^1 [MX-VEHKEY - ERROR] ^2 ', err.message, '^0')
          }
     }
}

const GetEntityFromPlate = async(plate:String) => {
     const getvehs = GetAllVehicles();
     for (let i = 0; i < getvehs.length; i++) {
          if (SplitSpaces(GetVehicleNumberPlateText(getvehs[i])) === SplitSpaces(plate)) {
               return getvehs[i]
          }
     }
     return false
}
const GetClosestPlayer = async(coords:Vector3, distance:number) => {
     let closestped, dst;
     const players = ESX.GetPlayers();
     for (let i = 0; i < players.length; i++) {
          closestped = GetPlayerPed(players[i]);
          if (DoesEntityExist(closestped)) {
               if (closestped && closestped > 0) {
                    dst = await CalculateDistance(await ArrayToVec3(GetEntityCoords(closestped)), coords);
                    if (dst && dst <= distance) {
                         return players[i]
                    }
               }
          }
     }
     return false
}    
const CreateNewkey = (source, data) => {
     const src = source
     const player = ESX.GetPlayerFromId(src)
     try {
          let info = {
                    plate: data.props.plate,
                    owner: player.identifier,
                    description: 'Plate ' + data.props.plate
               }
          player.addInventoryItem('vehiclekey', 1, info)
     }catch(err) {
          console.log(err.message)
     }
}

const UpdateVehiclesData = async() => {
     await Wait(2000);
     let entitycoords;
     for (const veh of Vehicles) {
          if (veh && veh.entity && DoesEntityExist(veh.entity)) {
               entitycoords = {
                    x: ArrayToVec3(GetEntityCoords(veh.entity)).x,
                    y: ArrayToVec3(GetEntityCoords(veh.entity)).y,
                    z: ArrayToVec3(GetEntityCoords(veh.entity)).z,
                    h: GetEntityHeading(veh.entity)
               }
               veh.data.coords = entitycoords;
          }
     }
}

ESX.RegisterServerCallback('mx-vehiclekey:GetVehicleFromPlate', async(source, cb, plate) => {
     const Vehicle = await GetVehicleFromPlate(plate);
     cb(Vehicle)
});

const GetVehicleFromPlate = async(plate) => {
     for (const veh of Vehicles) {
          if (veh && veh.data && veh.data.props) {
               if (SplitSpaces(veh.data.props.plate) === SplitSpaces(plate)) {
                    return veh;
               }
          }
     }
     return false
};

onNet('mx-vehiclekey:DestroyVehicle', async (plate) => {
     for (let veh in Vehicles) {
          if (veh && Vehicles[veh]) {
               if (SplitSpaces(Vehicles[veh].data.props.plate) === SplitSpaces(plate)) {
                    const result = await Fetch(`SELECT id FROM mx_vehicles WHERE id = '${Vehicles[veh].id}'`, {})
                    if (result && result[0]) {
                         await Execute(`DELETE FROM mx_vehicles WHERE id = '${result[0].id}'`, {});
                         await Execute(`INSERT INTO owned_vehicles (owner, vehicle) VALUES ('${Vehicles[veh].owner}', '${JSON.stringify(Vehicles[veh].data.props)}')`, {})
                         Vehicles[veh] = null;
                    }
                    break
               }
          }
     }
});

let timer = 0;
const Spam = async() => {
     while (true) {
          timer++
          await Wait(100)
          if (timer > 25) {timer = 0; break}
     }
}

let myVehicles = [];
ESX.RegisterServerCallback('mx-vehiclekey:GetMyVehicles', async(source, cb) => {
     if (timer === 0) {
          myVehicles = [];
          const player = ESX.GetPlayerFromId(source)
          for (const veh of Vehicles) {
               if (veh) {
                    veh.data = IsJson(veh.data) && JSON.parse(veh.data) || veh.data;
                    if (veh.owner == player.identifier) {
                         myVehicles.push({
                              plate: veh.data.props.plate
                         })
                    }
               }
          }
          if (myVehicles.length > 0) {
               cb(myVehicles)
          }else {
               cb(null)
          }
          Spam();
     }else {
          cb(myVehicles)
     }
     
});

onNet('mx-vehiclekey:CreateNewKey', function (data) {
     const src = (global as any).source;
     const player = ESX.GetPlayerFromId(src);
     if (player) {
          if (player.getMoney() >= 6000) {
               player.removeMoney(6000)
               CreateNewkey(src, {props: {
                         plate: data.plate
                    }
               })
          }else {
               player.showNotification("you don't have enough money.") 
          }
     }
});

onNet('mx-vehiclekey:GiveCar', async(target_id, plate) => {
     const src = (global as any).source
     const player = ESX.GetPlayerFromId(src);
     const target = ESX.GetPlayerFromId(target_id);
     if (source != target_id) {
          if (target) {
               for (let veh in Vehicles) {
                    if (veh) {
                         if (SplitSpaces(Vehicles[veh].data.props.plate) === SplitSpaces(plate)) {
                              if (Vehicles[veh].owner === player.identifier) {
                                   Vehicles[veh].owner = target.identifier;
                                   await Execute('UPDATE mx_vehicles SET owner = @owner WHERE id = @id', {
                                        ['@id']: Vehicles[veh].id,
                                        ['@owner']: target.identifier
                                   });
                                   player.showNotification(`The vehicle with ${plate} was given to ${target_id}.`)
                                   break
                              }else {
                                   player.showNotification("You don't own this vehicle")
                              }
                         }
                    }
               }
          }else {
               player.showNotification("Player's not online")
          }      
     }else {
          player.showNotification("You can't get yourself a car")
     }
});

const UpdateSqlQueries = async() => {
     await Wait(15000);
     let selectList:string;
     for (const veh of Vehicles) {
          if (veh &&veh.entity && DoesEntityExist(veh.entity)) {
               if (!selectList)  {
                    selectList = `UPDATE mx_vehicles u JOIN (SELECT ${veh.id} AS id, '${JSON.stringify(veh.data)}' AS new_data`
               }else {
                    selectList = selectList + ' UNION ' + `SELECT ${veh.id} AS id, '${JSON.stringify(veh.data)}' AS new_data`
               }
          }
     }
     if (!selectList) {return false} 
     selectList+= ") a ON u.id = a.id SET `data` = new_data"
     await Execute(selectList, {})
};

/* Trigger this to update your vehicle's mod. 
Example usage: TriggerServerEvent('mx-vehiclekey:UpdateVehicleProps', ESX.Game.GetVehicleProperties(GetVehiclePedIsIn(PlayerPedId(), false)))
*/
onNet('mx-vehiclekey:UpdateVehicleProps', async(props) => {
     if (!props) {return false}
     const vehicle = await GetVehicleFromPlate(props.plate)
     if (!vehicle) {return false}
     vehicle.props = props;
});

onNet('mx-vehiclekey:UpdateVehicleGps', async(item, plate) => {
     const src = (global as any).source;
     const player = ESX.GetPlayerFromId(src);
     const player_inv = player.getInventory();
     if (player) {
          if (player_inv[item.slot]) {
               player_inv[item.slot].metadata = {
                    plate: plate,
                    description: 'Plate ' + plate
               }
               emit('ox_inventory:setPlayerInventory', player, player_inv)
          }
          
     }
});

setTick(SpawnVehicles)
setTick(UpdateVehiclesData)
setTick(UpdateSqlQueries)




