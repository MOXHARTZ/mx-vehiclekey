import {CalculateDistance, Vector3, ArrayToVec3, Wait, SplitSpaces, MathRandom, IsJson} from '../server/s_lb';
import * as config from '../server/config.json';
let ESX, HotwireVeh = [];
emit('esx:getSharedObject', obj => (ESX = obj));

onNet('mx-vehiclekey:SpawnVehicles', async(data) => {
     let spawnedlist = [], vehicle, veh_coords, veh_data, net_id;
     for (let i = 0; i < data.length; i++) {
          veh_coords = data[i].veh_data.coords;
          veh_data = data[i].veh_data;
          if (!await HasCreatedVehicle(veh_data.props.plate)) {
               if (!HasModelLoaded(veh_data.props.model) && IsModelInCdimage(veh_data.props.model)) {
                    RequestModel(veh_data.props.model)
                    while (!HasModelLoaded(veh_data.props.model)) {
                         await Wait(100);
                    }
               }
               vehicle = CreateVehicle(veh_data.props.model, veh_coords.x, veh_coords.y, veh_coords.z, veh_coords.h || veh_coords.w, true, false)
               ESX.Game.SetVehicleProperties(vehicle, veh_data.props)
               SetEntityAsMissionEntity(vehicle, true, true)
               NetworkRegisterEntityAsNetworked(vehicle)
               net_id = VehToNet(vehicle)
               SetNetworkIdExistsOnAllMachines(net_id, true)
               NetworkSetNetworkIdDynamic(net_id, false)
               SetVehicleDoorsLocked(vehicle, 2)
               SetVehicleEngineOn(vehicle, false, true, true)
               SetModelAsNoLongerNeeded(veh_data.props.model)
               spawnedlist.push({veh_data})
               if (veh_data.impound) {
                    SetVehicleEngineHealth(vehicle, 1000);
                    SetVehicleBodyHealth(vehicle, 1000.0);
                    ESX.Game.SetVehicleProperties(vehicle, ESX.Game.GetVehicleProperties(vehicle));
               }
          }
     }
     emitNet('mx-vehiclekey:SpawnedVehicles', spawnedlist)
});

setTick(async() => {
     let sleep = 2000;
     const ped = PlayerPedId();
     const veh = GetVehiclePedIsIn(ped, false);
     if (IsPedInAnyVehicle(ped, false)) {
          sleep = 3 
          if (GetIsVehicleEngineRunning(veh) == false) {
               ESX.ShowHelpNotification('If you have a key ~r~use it~s~, if not type ~r~/hotwire~s~ for hotwire.')
          }
     }
     await Wait(sleep)
});

onNet("gameEventTriggered", function(name, args) {
     if (name == "CEventNetworkVehicleUndrivable") {
          const entity = args[0];
          if (DoesEntityExist(entity) && GetVehicleNumberPlateText(entity)) {
               TriggerServerEvent('mx-vehiclekey:DestroyVehicle', GetVehicleNumberPlateText(entity))
               DeleteEntity(entity)
          }
     }
});

setTick(async() => {
     await Wait(1250)
     const veh = GetVehiclePedIsIn(PlayerPedId(), false);
     const plate = GetVehicleNumberPlateText(veh);
     if (veh != 0 && DoesEntityExist(veh) && plate) {
          if (!HotwireVeh[plate]) {
                SetVehicleEngineOn(veh, false, true, true)
                HotwireVeh[plate] = true
          }
     }
});

setImmediate(() => {
     emit('chat:addSuggestion', '/givecar', "Give Car", [
          {name: "playerid", help: "The user id you want to give the key to"}
     ]);
     emit('chat:addSuggestion', '/hotwire', "Hotwire Car")
     emit('chat:addSuggestion', '/impound', "Impound Car")
});

RegisterCommand('givecar', async(source, args) => {
     const ped = PlayerPedId();
     const veh = GetVehiclePedIsIn(ped, false);
     if (args[0]) {
          if (veh != 0) {
               emitNet('mx-vehiclekey:GiveCar', args[0], GetVehicleNumberPlateText(veh));
          }else {
               const vehicle = await ClosestVehicle(5); 
               if (vehicle) {
                    emitNet('mx-vehiclekey:GiveCar', args[0], GetVehicleNumberPlateText(vehicle));
               }else {
                    ESX.ShowNotification('No vehicles nearby. ')
               }
          }
     }else {
          ESX.ShowNotification('Usage: /givecar playerid')
     }
}, false);

RegisterCommand('impound', async(source, args) => {
     const ped = PlayerPedId();
     const veh = GetVehiclePedIsIn(ped, false);
     if (await ImpoundAccess()) {
          if (veh != 0) {
               emitNet('mx-vehiclekey:DestroyVehicle', GetVehicleNumberPlateText(veh));
               DeleteEntity(veh);
               ESX.ShowNotification("The vehicle has been impounded.")
          }else {
               const vehicle = await ClosestVehicle(5); 
               if (vehicle) {
                    emitNet('mx-vehiclekey:DestroyVehicle', GetVehicleNumberPlateText(vehicle));
                    DeleteEntity(vehicle)
                    ESX.ShowNotification("The vehicle has been impounded.")
               }else {
                    ESX.ShowNotification('No vehicles nearby. ')
               }
          }
     }else {
          ESX.ShowNotification("You are not authorized to use this command.")
     }
}, false);

RegisterCommand('hotwire', async(source, args) => {
     const ped = PlayerPedId();
     const veh = GetVehiclePedIsIn(ped, false);
     if (IsPedInAnyVehicle(ped, false)) {
          if (GetIsVehicleEngineRunning(veh) == false) {
               // ur hotwire event...
               ESX.ShowNotification('hotwire in progress')
               await Wait(1500);
               ESX.ShowNotification('hotwire successful')
               SetVehicleEngineOn(veh, true, true, true)
          }else {
               ESX.ShowNotification('The engine of the vehicle is already on.')
          }
     }else {
          ESX.ShowNotification('You are not in a vehicle.')
     }
}, false);

const ImpoundAccess = async() => {
     const job = ESX.GetPlayerData().job.name;
     for (const access in config['impound_perm']) {
          if (config['impound_perm'][access] === job) {
               return true
          }
     }
     return false
}

const ShowFloatingHelpNotification = function(msg, coords) {
     AddTextEntry('ShowFloatingHelpNotification', msg)
	SetFloatingHelpTextWorldPosition(1, coords.x, coords.y, coords.z)
	SetFloatingHelpTextStyle(1, 1, 2, -1, 3, 0)
	BeginTextCommandDisplayHelp('ShowFloatingHelpNotification')
	EndTextCommandDisplayHelp(2, false, false, -1)
}

setTick(async() => {
     let sleep = 1250
     if (ESX) {
          const ped = PlayerPedId()
          const dst = await CalculateDistance(await ArrayToVec3(GetEntityCoords(ped, true)), {x:408.95, y:-1622.81, z:29.29});
          if (dst <= 3) {
               sleep = 3
               ShowFloatingHelpNotification('~r~E~s~ Create a new key', {x:408.95, y:-1622.81, z:29.29})
               if (IsControlJustPressed(0, 38)) {
                    ESX.UI.Menu.CloseAll()
                    let el = []
                    ESX.TriggerServerCallback('mx-vehiclekey:GetMyVehicles', async(handle) => {
                         if (handle) {
                              for (let test of handle) {
                                   el.push({
                                       label: `${test.plate} Key extraction fee $6000`,
                                       plate: test.plate
                                   })
                              }
                              ESX.UI.Menu.Open('default', GetCurrentResourceName(), 'takevehiclekey', {
                                   title: 'Create a new key',
                                   elements: el
                               }, 
                               function(data,menu) {
                                   ESX.UI.Menu.CloseAll()
                                   emitNet('mx-vehiclekey:CreateNewKey', {plate: data.current.plate})
                               }, function(data, menu) {
                                   menu.close()
                               })
                         }else {
                              return ESX.ShowNotification("You don't own a vehicle.");
                         }
                    })
               }
          }
     }
     await Wait(sleep)
})

const HasCreatedVehicle = async(plate) => {
     const vehicles = ESX.Game.GetVehicles();
     for (let h = 0; h < vehicles.length; h++) {
          if (DoesEntityExist(vehicles[h])) {
               if (SplitSpaces(GetVehicleNumberPlateText(vehicles[h])) === SplitSpaces(plate)) {
                    return true
               }
          }
     }
     return false
};

const ClosestVehicle = async(distance) => {
     const vehicles = ESX.Game.GetVehicles();
     for (let h = 0; h < vehicles.length; h++) {
          if (DoesEntityExist(vehicles[h])) {
               if (await CalculateDistance(await ArrayToVec3(GetEntityCoords(PlayerPedId(), true)), ArrayToVec3(GetEntityCoords(vehicles[h], false))) <= distance) {
                    return vehicles[h]
               }
          }
     }
     return false
};

setTick(async() => {
     let sleep = 2000
     if (ESX) {
          const pedcoords = GetEntityCoords(PlayerPedId(), true)
          const dst = await CalculateDistance(await ArrayToVec3(pedcoords), {x:483.75, y:-1312.15, z:29.21});
          if (dst <= 4) {
               sleep = 3
               ShowFloatingHelpNotification('~r~E~s~ Impounds', {x:483.75, y:-1312.15, z:29.21})
               if (IsControlJustPressed(0, 38)) {
                    ESX.UI.Menu.CloseAll()
                    let el = []
                    ESX.TriggerServerCallback('mx-vehiclekey:GetImpounds', function(handle) {
                         if (handle) {
                              for (const impound_data of handle) {
                                   impound_data.vehicle = IsJson(impound_data.vehicle) && JSON.parse(impound_data.vehicle) || impound_data.vehicle
                                   el.push({
                                        label: (`${impound_data.vehicle.plate} You have to pay $250 to get the vehicle.`),
                                        plate: impound_data.vehicle.plate,
                                        props: impound_data.vehicle
                                    })
                              }
                              ESX.UI.Menu.Open('default', GetCurrentResourceName(), 'impound', {
                                   title    : 'Impound',
                                   elements : el
                               }, 
                                function(data,menu) {
                                    ESX.UI.Menu.CloseAll()
                                    if (data.current.plate && data.current.props) {
                                         if (ESX.Game.IsSpawnPointClear({x:491.09, y:-1313.07, z:29.26}, 4.0)) {
                                              emitNet('mx-vehiclekey:TakeImpound', {
                                                   plate: data.current.plate,
                                                   props: data.current.props
                                               })
                                         }else {
                                             ESX.ShowNotification('There is another vehicle at the spawn point.')
                                         }
                                    }
                               }, function(data, menu) {
                                    menu.close()
                               })
                         }else {
                              ESX.ShowNotification("There is no vehicle in the impounds.")
                         }
                    })
               }
          }
     }
     await Wait(sleep)
})

onNet('mx-vehiclekey:UseKey', async(item) => {
     const ped = PlayerPedId();
     const veh = GetVehiclePedIsIn(ped, false);
     const meta = ESX.GetPlayerData().inventory[item.slot].metadata;
     if (veh != 0) {
          if (SplitSpaces(meta.plate) == SplitSpaces(GetVehicleNumberPlateText(veh))) {
               if (GetIsVehicleEngineRunning(veh)) {
                    SetVehicleEngineOn(veh, false, true, true)
                    ESX.ShowNotification('Vehicle engine is off.')
               }else {
                    SetVehicleEngineOn(veh, true, true, true)
                    ESX.ShowNotification('Vehicle engine is on.')
               }
          }else {
               ESX.ShowNotification('The key does not belong to this car.')
          }
     }else {
          const vehicle = await ClosestVehicle(5); 
          if (vehicle) {
               if (SplitSpaces(meta.plate) == SplitSpaces(GetVehicleNumberPlateText(vehicle))) {
                    const dict = "anim@mp_player_intmenu@key_fob@"
  	               RequestAnimDict(dict)
                    while (true) {
                         await Wait(100);
                         if (HasAnimDictLoaded(dict)) {
                              break
                         }
                    }
                    TaskPlayAnim(PlayerPedId(), dict, "fob_click_fp", 8.0, 8.0, -1, 48, 0, false, false, false)
                if (GetVehicleDoorLockStatus(vehicle) == 1) {
                     SetVehicleDoorsLocked(vehicle, 2)
                     PlayVehicleDoorCloseSound(vehicle, 1)
                     ESX.ShowNotification('The vehicle is locked.')
                }else if (GetVehicleDoorLockStatus(vehicle) == 2) {
                     SetVehicleDoorsLocked(vehicle, 1)
                     PlayVehicleDoorOpenSound(vehicle, 0)
                     ESX.ShowNotification('The vehicle is unlocked.')
                }
                await Wait(100)
                SetVehicleLights(vehicle, 2)
                await Wait(200)
                SetVehicleLights(vehicle, 1)
                await Wait(200)
                SetVehicleLights(vehicle, 2)
                await Wait(200)
                SetVehicleLights(vehicle, 1)
                await Wait(200)
                SetVehicleLights(vehicle, 2)
                await Wait(200)
                SetVehicleLights(vehicle, 0)
               }else {
                    ESX.ShowNotification('The key does not belong to this car.')
               }
          }else {
               ESX.ShowNotification('No vehicles nearby. ')
          }
     }
});

onNet('mx-vehiclekey:AddWhitelistVeh', function(veh) {
     if (!veh) {return false}
     HotwireVeh[veh] = true
});

const CreateBlip = () => {
     const blipData = [
          {
               name: 'Create a new key', 
               coords: {x:408.95, y:-1622.81, z:29.29},
               sprite: 100,
               color: 2
          },
          {
               name: 'Impounds',
               coords: {x:483.75, y:-1312.15, z:29.21},
               sprite: 100,
               color: 2
          }
     ]
     for (const data of blipData) {
          const blip = AddBlipForCoord(data.coords.x, data.coords.y, data.coords.z)
          SetBlipSprite(blip, data.sprite)
          SetBlipScale(blip, 0.8)
          SetBlipColour(blip, data.color)
          SetBlipAsShortRange(blip, true)
          BeginTextCommandSetBlipName('STRING')
          AddTextComponentSubstringPlayerName(data.name)
          EndTextCommandSetBlipName(blip)
     }
}
CreateBlip()

onNet('mx-vehiclekey:CreateVehicleGps', function(item) {
     const meta = ESX.GetPlayerData().inventory[item.slot].metadata
     if (meta && meta.plate) {
          ESX.TriggerServerCallback('mx-vehiclekey:GetVehicleFromPlate', function(vehicle) {
               if (vehicle && vehicle.data) {
                    const coords = {
                         x: vehicle.data.coords.x,
                         y: vehicle.data.coords.y,
                         z: vehicle.data.coords.z,
                    }
                    emit('mx-vehiclekey:UseVehicleGps', coords)
               }else {
                    ESX.ShowNotification('Vehicle inform not found.')
               }
          }, meta.plate || '')
     }else {
          const veh = GetVehiclePedIsIn(PlayerPedId(), false)
          if (veh != 0) {
               const plate = GetVehicleNumberPlateText(veh)
               if (plate) {
                    emitNet('mx-vehiclekey:UpdateVehicleGps', item, plate)
                    ESX.ShowNotification('Gps connected to vehicle')
               }
          }else {
               ESX.ShowNotification('You are not in a vehicle.')
          }
     }
})

onNet('mx-vehiclekey:UseVehicleGps', async(coords) => {
     ESX.ShowNotification('Marked on gps')
     let alpha = 250
     let blip = AddBlipForRadius(coords.x + await MathRandom(30, 70), coords.y + await MathRandom(10, 50), coords.z, 300.0)
     SetBlipSprite(blip, 9)
     SetBlipColour(blip, 1)
     SetBlipAsShortRange(blip, true)
     SetBlipAlpha(blip, alpha)
     BeginTextCommandSetBlipName('STRING')
     AddTextComponentSubstringPlayerName('Vehicle Location')
     EndTextCommandSetBlipName(blip)
     let time = 7
     while (true) {
          await Wait(time * 1000)
          time = time - 1
          alpha = alpha - 70
          SetBlipAlpha(blip, alpha)
          if (time == 0) {
               RemoveBlip(blip)
          }
     }
});