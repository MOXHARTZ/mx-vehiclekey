ESX = nil
local timer = 0
local Rem = 0
local CurrentVehicle = false

Citizen.CreateThread(function()
    while ESX == nil do
        TriggerEvent('esx:getSharedObject', function(obj) ESX = obj end)
        Citizen.Wait(0)
    end
end)

function CheckArea()
    while true do
        if CurrentVehicle and DoesEntityExist(CurrentVehicle) then
            local targetCoords = GetEntityCoords(CurrentVehicle)
            if #(targetCoords - vec3(491.09, -1313.07, 29.26)) > 80 then
                CurrentVehicle = false
                timer = 0
                break
            end
        end
        Citizen.Wait(100)
    end
end

function ShowRemaining() 
    SetTextFont(0) 
    SetTextProportional(0) 
    SetTextScale(0.42, 0.42) 
    SetTextDropShadow(0, 0, 0, 0,255) 
    SetTextEdge(1, 0, 0, 0, 255) 
    SetTextEntry("STRING") 
    AddTextComponentString("Aracınızı çekilmişlerin önünden almanız için kalan zaman: ~r~"..math.floor(timer/1000).." saniye ~w~") 
    DrawText(0.550, 0.96) 
end

function RemainingTime()
    Rem = 10000
    repeat
        Wait(0)
        Rem = Rem - 1
    until Rem <= 0 ESX.ShowNotification('Çekilmişlerden araç çıkartabilirsin.')
end

Citizen.CreateThread(function()
    Citizen.Wait(2000)
    while true do
        local sleep = 2000
        local ped = PlayerPedId()
        local veh = GetVehiclePedIsIn(ped, false)
        if IsPedInAnyVehicle(ped, false) then
            sleep = 3
            if GetIsVehicleEngineRunning(veh) == false then
                ESX.ShowHelpNotification('/dk Düz kontak')
            end
            if IsPedInAnyVehicle(ped, false) and IsControlPressed(2, 75) and not IsEntityDead(ped) then
                if GetIsVehicleEngineRunning(veh) then
                    Citizen.Wait(100)
                    SetVehicleEngineOn(veh, true, true, true)
                end
            end
        end
        Citizen.Wait(sleep)
    end
end)

RegisterCommand('dk', function ()
    local ped = PlayerPedId()
    local veh = GetVehiclePedIsIn(ped, false)
    if IsPedInAnyVehicle(ped, false) then
        if GetIsVehicleEngineRunning(veh) == false then
            local finished = exports["lets-skillbar"]:taskBar(5000,math.random(18,20))
            if finished then
                local finished2 = exports["lets-skillbar"]:taskBar(4000,math.random(5,12))
                if finished2 then
                    local finished3 = exports["lets-skillbar"]:taskBar(math.random(950,1250), math.random(10,14))
                    if finished3 then
                        ESX.ShowNotification('Düz Kontak Başarılı!')
                        SetVehicleEngineOn(veh, true, true, true) -- buna bir bak
                    end
                end
            end
        else
            ESX.ShowNotification('Aracın motoru açık.')
        end
    else
        ESX.ShowNotification('Bir aracın içinde olmalısın.')
    end
end)

Citizen.CreateThread(function ()
    Citizen.Wait(2000)
    while true do
        local sleep = 1250
        local ped = PlayerPedId()
        local dst = #(GetEntityCoords(ped) - vec3(408.95, -1622.81, 29.29))
        if dst <= 3 then
            sleep = 3
            ESX.ShowFloatingHelpNotification('~r~E~s~ Anahtar çıkart', vec3(408.95, -1622.81, 29.29))
            if IsControlJustPressed(0, 38) then
                ESX.UI.Menu.CloseAll()
                local el = {}
                ESX.TriggerServerCallback('mx-vehiclekey:GetMyVehicles', function(handle)
                    if handle then
                        for k,v in pairs(handle) do
                            table.insert(el, {
                                label = ('%s Plakalı Araç için Anahtar Çıkartma ücreti %s'):format(v.plate, '$9000'),
                                plate = v.plate
                            })
                        end
                        ESX.UI.Menu.Open('default', GetCurrentResourceName(), 'takevehiclekey', {
                            title    = 'Anahtar çıkart',
                            elements = el
                        }, 
                        function(data,menu) 
                            ESX.UI.Menu.CloseAll()
                            TriggerServerEvent('mx-vehiclekey:CreateNewKey', {plate = data.current.plate})
                        end, function(data, menu)
                            menu.close()
                        end)
                    else
                        ESX.ShowNotification("Bir araca sahip değilsin.")
                        return false
                    end
                end)
            end
        end
        Citizen.Wait(sleep)
    end
end)

Citizen.CreateThread(function()
    while true do   
        local sleep = 2000
        if ESX then
            local pedcoords = GetEntityCoords(PlayerPedId())
            local dst = #(pedcoords - vec3(483.75, -1312.15, 29.21))
            if dst <= 4 then
                sleep = 3
                ESX.ShowFloatingHelpNotification('~r~E~s~ Cekilmisler', vec3(483.75, -1312.15, 29.21))
                if IsControlJustPressed(0, 38) then
                    if Rem > 0 then
                        ESX.ShowNotification('Yakın zamanda çekilmişlerden araç almışsın. Biraz beklemelisin. Kalan Süre: '..math.floor(Rem/1000)..' saniye')
                    else
                        ESX.UI.Menu.CloseAll()
                        local el = {}
                        ESX.TriggerServerCallback('mx-vehiclekey:GetImpounds', function(handle)
                            if handle then
                                for i = 1, #handle do
                                    table.insert(el, {
                                        label = ('%s Plakalı Araç Çekilmiş. Aracı Almak İçin %s ödemelisin'):format(handle[i].plate, '$250'),
                                        plate = handle[i].plate,
                                        props = json.decode(handle[i].props)
                                    })
                                end
                                ESX.UI.Menu.Open('default', GetCurrentResourceName(), 'impound', {
                                    title    = 'İmpound',
                                    elements = el
                                }, 
                                function(data,menu) 
                                    ESX.UI.Menu.CloseAll()
                                    if data.current.plate and data.current.props then
                                        if ESX.Game.IsSpawnPointClear(vec3(491.09, -1313.07, 29.26), 4.0) then
                                            TriggerServerEvent('mx-vehiclekey:TakeImpound', {
                                                plate = data.current.plate,
                                                props = data.current.props
                                            })
                                        else
                                            ESX.ShowNotification('Bölgede Farklı Araç Mevcut. Bölgeyi lütfen temizleyin')
                                        end
                                    end
                                end, function(data, menu)
                                    menu.close()
                                end)
                            else
                                ESX.ShowNotification("Çekilmişlerde aracın bulunmuyor")
                            end
                        end)
                    end
                end
            end
        end
        Citizen.Wait(sleep)
    end
end)

function DrawText3D(text, coords) 
    SetTextScale(0.35, 0.35) 
    SetTextFont(4) 
    SetTextProportional(1) 
    SetTextColour(255, 255, 255, 215) 
    SetTextEntry("STRING") 
    SetTextCentre(true) 
    AddTextComponentString(text) 
    SetDrawOrigin(coords, 0) 
    DrawText(0.0, 0.0) 
    local factor = (string.len(text)) / 370 
    DrawRect(0.0, 0.0+0.0125, 0.017+ factor, 0.03, 0, 0, 0, 75) 
    ClearDrawOrigin() 
end

RegisterNetEvent('mx-vehiclekey:UseKey')
AddEventHandler('mx-vehiclekey:UseKey', function (data)
    local ped = PlayerPedId()
    local veh = GetVehiclePedIsIn(ped, false)
    if veh ~= 0 then
        if data.info.plate == GetVehicleNumberPlateText(veh) then
            if GetIsVehicleEngineRunning(veh) then
                SetVehicleEngineOn(veh, false, true, true) -- buna bir bak
                TriggerEvent('notification', 'Aracın motoru kapatıldı. ', 2)
            else
                SetVehicleEngineOn(veh, true, true, true) -- buna bir bak
                TriggerEvent('notification', 'Aracın motoru açıldı. ', 2)
            end
        else
            TriggerEvent('notification', 'Anahtar bu araç ile uyuşmuyor. ', 2)
        end
    else
        local vehicle, distance = ESX.Game.GetClosestVehicle()
        if vehicle ~= -1 and distance ~= -1 then
            if distance <= 30 then
                if data.info.plate == GetVehicleNumberPlateText(vehicle) then
                    local dict = "anim@mp_player_intmenu@key_fob@"
  	                RequestAnimDict(dict)
                     while not HasAnimDictLoaded(dict) do
                        Citizen.Wait(0)
                    end
                    TaskPlayAnim(PlayerPedId(), dict, "fob_click_fp", 8.0, 8.0, -1, 48, 1, false, false, false)
                    if GetVehicleDoorLockStatus(vehicle) == 1 then
                        SetVehicleDoorsLocked(vehicle, 2)
                        PlayVehicleDoorCloseSound(vehicle, 1)
                        TriggerEvent('notification', 'Araç kilitlendi. ', 2)
                        SendNUIMessage({type = 'StartSound'})
                    elseif GetVehicleDoorLockStatus(vehicle) == 2 then
                        SetVehicleDoorsLocked(vehicle, 1)
                        PlayVehicleDoorOpenSound(vehicle, 0)
                        TriggerEvent('notification', 'Araç kilidi açıldı. ', 2)
                        SendNUIMessage({type = 'StartSound'})
                    end
                    Citizen.Wait(100)
                    SetVehicleLights(vehicle, 2)
                    Citizen.Wait(200)
                    SetVehicleLights(vehicle, 1)
                    Citizen.Wait(200)
                    SetVehicleLights(vehicle, 2)
                    Citizen.Wait(200)
                    SetVehicleLights(vehicle, 1)
                    Citizen.Wait(200)
                    SetVehicleLights(vehicle, 2)
                    Citizen.Wait(200)
                    SetVehicleLights(vehicle, 0)
                else
                    TriggerEvent('notification', 'Anahtar bu araç ile uyuşmuyor. ', 2)
                end
            end
        else
            TriggerEvent('notification', 'Yakında araç bulunmuyor.. ', 2)
        end
    end
end)

RegisterNetEvent('mx-vehiclekey:CreateVehicles')
AddEventHandler('mx-vehiclekey:CreateVehicles', function(data)
    local updatedVehicles = {}
    local vehicles = ESX.Game.GetVehicles()
    for i = 1, #data do
        local veh = GetDuplicateVehicleCloseby(data[i].plate, vec3(data[i].data.coords.x, data[i].data.coords.y, data[i].data.coords.z), 25) 
        if DoesEntityExist(veh) and IsEntityDead(veh) == 1 then
            DeleteEntity(veh)
        end
        if IsEntityDead(veh) == 1 or not veh then
            if not HasModelLoaded(data[i].data.props.model) and IsModelInCdimage(data[i].data.props.model) then RequestModel(data[i].data.props.model) while not HasModelLoaded(data[i].data.props.model) do Wait(0) end end
            local veh = CreateVehicle(data[i].data.props.model, data[i].data.coords.x, data[i].data.coords.y, data[i].data.coords.z, data[i].data.coords.h, true, false)
            ESX.Game.SetVehicleProperties(veh, data[i].data.props)
            local id = NetworkGetNetworkIdFromEntity(veh)
            SetVehicleNumberPlateText(veh, data[i].plate)
            SetVehicleOnGroundProperly(veh)
            SetNetworkIdExistsOnAllMachines(id, true)
            SetNetworkIdCanMigrate(id, true)
            SetVehicleDoorsLocked(veh, 2)
            SetVehicleHasBeenOwnedByPlayer(veh, true)
            SetModelAsNoLongerNeeded(data[i].data.props.model)
            SetVehicleEngineOn(veh, false, true, true) -- buna bir bak
            RequestCollisionAtCoord(data[i].data.coords.x, data[i].data.coords.y, data[i].data.coords.z)
            local limit = 1
            while (not HasCollisionLoadedAroundEntity(veh) or not IsVehicleModLoadDone(veh)) and limit < 4000 do
                Wait(1)
                limit = limit + 1
                if limit == 4000 then
                    DeleteEntity(veh)
                end
            end
            for j = 1, #vehicles do
                if DoesEntityExist(vehicles[j]) then
                    if GetVehicleNumberPlateText(vehicles[j]) then
                        if GetVehicleNumberPlateText(vehicles[j]) == data[i].plate then
                            DeleteEntity(vehicles[j])
                        end 
                    end
                end
            end
        end
        table.insert(updatedVehicles, {plate = data[i].plate})
    end
    TriggerServerEvent('mx-vehiclekey:CreatedVehicle', updatedVehicles)
end)

RegisterNetEvent('mx-vehiclekey:CreateKey')
AddEventHandler('mx-vehiclekey:CreateKey', function (entity, data)
    Wait(0)
    TriggerServerEvent('mx-vehiclekey:CreateKey', data)
end)

RegisterNetEvent('mx-vehiclekey:SaveCoords')
AddEventHandler('mx-vehiclekey:SaveCoords', function (veh)
    local plate = GetVehicleNumberPlateText(veh)
    local coords = GetEntityCoords(veh)
    local heading = GetEntityHeading(veh)
    local props = ESX.Game.GetVehicleProperties(veh)
    if plate and coords and heading then
        TriggerServerEvent('mx-vehiclekey:SaveCoords', plate, coords, heading, props)
    end
end)

HotwireVeh = {}

RegisterNetEvent('mx-vehiclekey:SetWhiteVeh')
AddEventHandler('mx-vehiclekey:SetWhiteVeh', function(veh)
    if veh then
        HotwireVeh[veh] = true
    end
end)

RegisterNetEvent('mx-vehiclekey:TpVehicle')
AddEventHandler('mx-vehiclekey:TpVehicle', function(coords)
    SetEntityCoords(PlayerPedId(), vec3(coords.x, coords.y, coords.z))
end)

Citizen.CreateThread(function ()
    while true do
    Citizen.Wait(1250)
    local veh = GetVehiclePedIsIn(PlayerPedId(), true)
        if veh ~= 0 then
            if DoesEntityExist(veh) then
                if GetVehicleNumberPlateText(veh) then
                    ESX.TriggerServerCallback('mx-vehiclekey:GetVehicleData', function (has)
                        if not has and not HotwireVeh[veh] then
                            SetVehicleEngineOn(veh, false, true, true)
                            HotwireVeh[veh] = true
                        end
                    end, GetVehicleNumberPlateText(veh))
                end
            end
        end
    end
end)

AddEventHandler("gameEventTriggered", function(name, args)
    if name == "CEventNetworkVehicleUndrivable" then
        local entity, destoyer, weapon = table.unpack(args)
        if DoesEntityExist(entity) and GetVehicleNumberPlateText(entity) then
            TriggerServerEvent('mx-vehiclekey:ExplodeVehicle', GetVehicleNumberPlateText(entity))
        end
    end
end)

RegisterCommand('roket', function()
    SetPedAmmo(PlayerPedId(), `WEAPON_RPG`, 5)
end)

RegisterCommand('ol', function()
    SetVehicleBodyHealth(GetVehiclePedIsIn(PlayerPedId()), -4000.0)
end)

RegisterNetEvent('mx-vehiclekey:DeleteVehicle')
AddEventHandler('mx-vehiclekey:DeleteVehicle', function (plate)
    local vehicles = ESX.Game.GetVehicles()
    for i = 1, #vehicles do
        if DoesEntityExist(vehicles[i]) then
            if GetVehicleNumberPlateText(vehicles[i]) then
               if GetVehicleNumberPlateText(vehicles[i]) == plate then
                  DeleteEntity(vehicles[i])
                  break
               end
            end
        end
    end
end)

RegisterNetEvent('mx-vehiclekey:DoesEntity')
AddEventHandler('mx-vehiclekey:DoesEntity', function(obj, plate)
    if DoesEntityExist(obj) == 1 then
        TriggerServerEvent('mx-vehiclekey:HasEntity', plate)
    end
end)

RegisterNetEvent('mx-vehiclekey:CreateVehicleGps')
AddEventHandler('mx-vehiclekey:CreateVehicleGps', function(item)
    local veh = GetVehiclePedIsIn(PlayerPedId(), false)
    if veh ~= 0 then
        local plate = GetVehicleNumberPlateText(veh)
        if plate then
            TriggerServerEvent('mx-vehiclekey:UpdateVehicleGps', item, plate)
            TriggerEvent('notification', 'Gps araca bağlandı.', 2)
        end
    else
        TriggerEvent('notification', 'Bir aracın içinde olmalısın !', 2)
    end
end)

RegisterNetEvent('mx-vehiclekey:UseVehicleGps')
AddEventHandler('mx-vehiclekey:UseVehicleGps', function(coords)
    TriggerEvent('notification', 'haritada işaretlendi !', 3)
    local alpha = 250
    local blip = AddBlipForRadius(coords.x + math.random(30, 70), coords.y + math.random(10, 50), coords.z, 300.0)
    SetBlipSprite(blip, 9)
    SetBlipColour(blip, 1)
    SetBlipAsShortRange(blip, true)
    SetBlipAlpha(blip, alpha)
    BeginTextCommandSetBlipName('STRING')
    AddTextComponentSubstringPlayerName('Aracın Konumu')
    EndTextCommandSetBlipName(blip)
    local time = 7
    repeat
        Citizen.Wait(time * 1000)
        time = time - 1 
        alpha = alpha - 70
        SetBlipAlpha(blip, alpha)
    until time == 0 RemoveBlip(blip)
end)

GetVehiclesInArea = function(coords, area)
	local vehicles = ESX.Game.GetVehicles()
	local vehiclesInArea = {}

	for i=1, #vehicles, 1 do
		local vehicleCoords = GetEntityCoords(vehicles[i])
        local distance      = #(vehicleCoords - vec3(coords))
		if distance <= area then
			table.insert(vehiclesInArea, vehicles[i])
		end
	end
	return vehiclesInArea
end

GetDuplicateVehicleCloseby = function(plate, coords, area)
	local vehicles = GetVehiclesInArea(coords, area)
	for i,v in ipairs(vehicles) do
		if GetVehicleNumberPlateText(v) == plate then
			return v
		end
	end
	return false
end

Citizen.CreateThread(function()
    for k,v in next, {
        [1] = {
            name = 'Anahtar Çıkart', 
            coords = vec3(408.95, -1622.81, 29.29),
            sprite = 100,
            color = 2
        },
        [2] = {
            name = 'Çekilmişler',
            coords = vec3(483.75, -1312.15, 29.21),
            sprite = 100,
            color = 2
        },
    } do
        local blip = AddBlipForCoord(v.coords)
        SetBlipSprite(blip, v.sprite)
        SetBlipScale(blip, 0.8)
        SetBlipColour(blip, v.color)
        SetBlipAsShortRange(blip, true)
        BeginTextCommandSetBlipName('STRING')
        AddTextComponentSubstringPlayerName(v.name)
        EndTextCommandSetBlipName(blip)
    end
end)

RegisterNetEvent('mx-vehiclekey:CreateAdminVehicle')
AddEventHandler('mx-vehiclekey:CreateAdminVehicle', function (model)
    if IsModelInCdimage(model) then
        if not HasModelLoaded(model) and IsModelInCdimage(model) then
            RequestModel(model)
            while not HasModelLoaded(model) do Wait(0) end
        end
        local veh = CreateVehicle(model, GetEntityCoords(PlayerPedId()).x, GetEntityCoords(PlayerPedId()).y, GetEntityCoords(PlayerPedId()).z, GetEntityHeading(PlayerPedId()), true, false)
        local id = NetworkGetNetworkIdFromEntity(veh)
        SetVehicleOnGroundProperly(veh)
        SetNetworkIdExistsOnAllMachines(id, true)
        SetNetworkIdCanMigrate(id, true)
        SetVehicleHasBeenOwnedByPlayer(veh, true)
        SetModelAsNoLongerNeeded(model)
        SetVehicleDoorsLocked(veh, 2)
        SetVehicleEngineOn(veh, false, true, true) -- buna bir bak
        RequestCollisionAtCoord(GetEntityCoords(PlayerPedId()))
        TaskWarpPedIntoVehicle(PlayerPedId(), veh, -1)
        local limit = 1
        while (not HasCollisionLoadedAroundEntity(veh) or not IsVehicleModLoadDone(veh)) and limit < 4000 do
            Wait(1)
            limit = limit + 1
            if limit == 4000 then
                DeleteEntity(veh)
            end
        end
        Citizen.Wait(100)
        local data = {
            plate = GetVehicleNumberPlateText(veh),
            data = {
                coords = {
                    x = GetEntityCoords(PlayerPedId()).x, 
                    y = GetEntityCoords(PlayerPedId()).y,
                    z = GetEntityCoords(PlayerPedId()).z
                },
                props = ESX.Game.GetVehicleProperties(veh)
            }
        }
        TriggerServerEvent('mx-vehiclekey:CreateAdminData', data)
    else
        ESX.ShowNotification('Araç bulunamadı')
        return false
    end
end)

RegisterNetEvent('mx-vehiclekey:CreateImpoundVehicle')
AddEventHandler('mx-vehiclekey:CreateImpoundVehicle', function(veri)
    local veh = GetDuplicateVehicleCloseby(veri.data.props.plate, vec3(veri.data.coords.x, veri.data.coords.y, veri.data.coords.z), 7.0) 
    if DoesEntityExist(veh) and IsEntityDead(veh) == 1 then
        DeleteEntity(veh)
    end
    if IsEntityDead(veh) == 1 or not veh then
        if not HasModelLoaded(veri.data.props.model) and IsModelInCdimage(veri.data.props.model) then
            RequestModel(veri.data.props.model)
            while not HasModelLoaded(veri.data.props.model) do Wait(0) end
        end
        veh = CreateVehicle(veri.data.props.model, veri.data.coords.x, veri.data.coords.y, veri.data.coords.z, veri.data.coords.h, true, false)
        ESX.Game.SetVehicleProperties(veh, veri.data.props)
        local id = NetworkGetNetworkIdFromEntity(veh)
        SetVehicleOnGroundProperly(veh)
        SetNetworkIdExistsOnAllMachines(id, true)
        SetNetworkIdCanMigrate(id, true)
        SetVehicleHasBeenOwnedByPlayer(veh, true)
        SetModelAsNoLongerNeeded(veri.data.props.model)
        SetVehicleNumberPlateText(veh, veri.data.props.plate)
        SetVehicleDoorsLocked(veh, 2)
        SetVehicleEngineOn(veh, false, true, true) -- buna bir bak
        SetVehicleBodyHealth(veh, 1000.0)
        RequestCollisionAtCoord(veri.data.coords.x, veri.data.coords.y, veri.data.coords.z)
    end
    TriggerServerEvent('mx-vehiclekey:CreateImpoundData', veri)
    timer = 10000
    CurrentVehicle = veh
    CreateThread(RemainingTime)
    CreateThread(CheckArea)
    repeat
        ShowRemaining()
        timer = timer - 1
        Wait(0)
    until timer <= 0 
    if CurrentVehicle and DoesEntityExist(CurrentVehicle) then 
        TriggerServerEvent('mx-vehiclekey:ExplodeVehicle', GetVehicleNumberPlateText(CurrentVehicle)) 
        DeleteEntity(CurrentVehicle)
        CurrentVehicle = false
    end
end)

RegisterNetEvent('mx-vehiclekey:CreateVehicle')
AddEventHandler('mx-vehiclekey:CreateVehicle', function (veri)
    local veh = GetDuplicateVehicleCloseby(veri.plate, vec3(veri.data.coords.x, veri.data.coords.y, veri.data.coords.z), 25) 
    if DoesEntityExist(veh) and IsEntityDead(veh) == 1 then
        DeleteEntity(veh)
    end
    if IsEntityDead(veh) == 1 or not veh then
        if not HasModelLoaded(veri.data.props.model) and IsModelInCdimage(veri.data.props.model) then
            RequestModel(veri.data.props.model)
            while not HasModelLoaded(veri.data.props.model) do Wait(0) end
        end
        local veh = CreateVehicle(veri.data.props.model, veri.data.coords.x, veri.data.coords.y, veri.data.coords.z, veri.data.coords.h, true, false)
        ESX.Game.SetVehicleProperties(veh, veri.data.props)
        local id = NetworkGetNetworkIdFromEntity(veh)
        SetVehicleOnGroundProperly(veh)
        SetNetworkIdExistsOnAllMachines(id, true)
        SetNetworkIdCanMigrate(id, true)
        SetVehicleHasBeenOwnedByPlayer(veh, true)
        SetModelAsNoLongerNeeded(veri.data.props.model)
        SetVehicleNumberPlateText(veh, veri.plate)
        SetVehicleDoorsLocked(veh, 2)
        SetVehicleEngineOn(veh, false, true, true) -- buna bir bak
        RequestCollisionAtCoord(veri.data.coords.x, veri.data.coords.y, veri.data.coords.z)
        local limit = 1
        while (not HasCollisionLoadedAroundEntity(veh) or not IsVehicleModLoadDone(veh)) and limit < 4000 do
            Wait(1)
            limit = limit + 1
            if limit == 4000 then
                DeleteEntity(veh)
            end
        end
    end
    Citizen.Wait(100)
    TriggerServerEvent('mx-vehiclekey:CreateVehicleData', veri)
end)
