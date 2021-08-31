ESX = nil TriggerEvent('esx:getSharedObject', function(obj) ESX = obj end) MX = nil TriggerEvent('mx-base:getSharedObject', function(Library) MX = Library end)
Vehicles = {} Waiting = {}

local StringCharset = {}
local NumberCharset = {}

for i = tonumber('48'),  tonumber('57') do table.insert(NumberCharset, string.char(i)) end
for i = tonumber('65'),  tonumber('90') do table.insert(StringCharset, string.char(i)) end
for i = tonumber('97'), tonumber('122') do table.insert(StringCharset, string.char(i)) end

RandomStr = function(length)
	if length > tonumber('0') then
		return RandomStr(length-tonumber('1')) .. StringCharset[math.random(tonumber('1'), #StringCharset)]
	else
		return ''
	end
end

RandomInt = function(length)
	if length > tonumber('0') then
		return RandomInt(length-tonumber('1')) .. NumberCharset[math.random(tonumber('1'), #NumberCharset)]
	else
		return ''
	end
end

Citizen.CreateThread(function ()
    -- Citizen.Wait(7000)
    Sql:execute("SELECT * FROM mx_vehicles", {}, function (results)
        if #results > 0 then
            for i = 1, #results do
                Vehicles[results[i].plate] = results[i]
                Vehicles[results[i].plate].data = json.decode(Vehicles[results[i].plate].data)
            end
        end
    end)
end)

Sql = exports['ghmattimysql']

MX.RegisterUsableItem('vehiclekey', function(source, item)
    if item.info.plate and item.info.uniq then
        if Vehicles[item.info.plate] then
            if Vehicles[item.info.plate].data.uniq == item.info.uniq then
                TriggerClientEvent('mx-vehiclekey:UseKey', source, item)
            else
                TriggerClientEvent('notification', source, 'Aracın anahtarları değiştirilmiş', 3)
            end
        else
            TriggerClientEvent('notification', source, 'Arac bulunamadı... :(', 3)
        end
    else
        TriggerClientEvent('notification', source, 'Arac bulunamadı. :(', 3)
    end
end)

MX.RegisterUsableItem('vehiclegps', function (source, item)
    if item.info.plate then
        if Vehicles[item.info.plate] then
            local coords = {
                x = Vehicles[item.info.plate].data.coords.x,
                y = Vehicles[item.info.plate].data.coords.y,
                z = Vehicles[item.info.plate].data.coords.z
            }
            TriggerClientEvent('mx-vehiclekey:UseVehicleGps', source, coords)
        else
            TriggerClientEvent('notification', 'Araç bulunamadı !', 2)
        end
    else
        TriggerClientEvent('mx-vehiclekey:CreateVehicleGps', source, item)
    end
end)

RegisterNetEvent('mx-vehiclekey:ExplodeVehicle')
AddEventHandler('mx-vehiclekey:ExplodeVehicle', function (plate)
    if Vehicles[plate] then
        Sql:execute("SELECT plate FROM mx_vehicles WHERE plate = '"..plate.."'", {}, function (result)
            if result and result[1] then
                Sql:execute("DELETE FROM mx_vehicles WHERE plate = '"..plate.."'", {})
                Sql:execute("INSERT INTO bbvehicles (identifier, plate, props) VALUES ('"..Vehicles[plate].owner.."', '"..plate.."', '"..json.encode(Vehicles[plate].data.props).."')")
                if Vehicles[plate].owner then
                    local player = ESX.GetPlayerFromCitizenId(Vehicles[plate].owner)
                    if player then
                        TriggerEvent('esx_addons_gcphone:motelSendMessage', player.source, 'Mei Sigorta', 'Aracınız kullanılamaz hale geldiği için sigorta şirketimiz aracınızı çekilmişlere alıcak. Yakın zamanda aracınızı çekilmişlerden alabilirsiniz.')
                    end
                end
                Vehicles[plate] = nil
            end
        end)
    end
end)

RegisterNetEvent('mx-vehiclekey:CreateAdminData')
AddEventHandler('mx-vehiclekey:CreateAdminData', function (data)
    local src = source
    local player = ESX.GetPlayerFromId(src)
    local playerx = MX.GetPlayerFromId(src)
    local entity = GetVehicleFromPlate(data.plate)
    if not entity then print('LINE 93 NOT ENTITY VALUE') end
    local info = {}
    info.uniq = 'MX-'..tostring(RandomInt(tonumber('4')) .. RandomInt(tonumber('3')) .. RandomInt(tonumber('2')) .. RandomInt(tonumber('3')) .. RandomStr(tonumber('4')))
    info.plate = data.plate
    info.owner = player.citizenid
    data.data.uniq = info.uniq
    playerx.addItem('vehiclekey', tonumber('1'), false, info)
    playerx.addItem('vehiclekey', tonumber('1'), false, info)
    Sql:execute("INSERT INTO mx_vehicles (owner, plate, data) VALUES ('"..player.citizenid.."', '"..data.plate.."', '"..json.encode(data.data).."')", {})
    Vehicles[data.plate] = {
        owner = player.citizenid,
        plate = data.plate,
        entity = entity,
        data = data.data
    }
end)

RegisterCommand('aracdevret', function(source, args)
    local player = ESX.GetPlayerFromId(source)
    if args[1] and args[2] then
        local target = ESX.GetPlayerFromId(args[2])
        if Vehicles[args[1]] and target then
            if Vehicles[args[1]].owner then
                if Vehicles[args[1]].owner == player.citizenid then
                    Vehicles[args[1]].owner = target.citizenid
                    Sql:execute("UPDATE mx_vehicles SET owner = '"..target.citizenid.."' WHERE plate = '"..args[1].."'", {})
                    TriggerClientEvent('notification', args[2], args[1]..' Plakalı araç artık senin', 3)
                    TriggerClientEvent('notification', source, args[1]..' Plakalı aracı '..GetPlayerName(args[2])..' verdin', 3)
                else
                    TriggerClientEvent('notification', source, 'Bu araç sana ait değil.', 3)
                end
            else
                TriggerClientEvent('notification', source, 'Bilinmedik bir hata oluştu.', 3)
            end
        else
            TriggerClientEvent('notification', source, 'Bu araç birisine ait değil yada girdiğin id üzerinde bir oyuncu bulunmuyor.', 3)
        end
    else
        TriggerClientEvent('notification', source, 'Araç plakası ve oyuncu id girmelisin', 3)
    end
end)

RegisterCommand('arabackra', function(source, args)
    local player = ESX.GetPlayerFromId(source)
    if player.getGroup() == 'admin' then
        if args[1] then
            TriggerClientEvent('mx-vehiclekey:CreateAdminVehicle', source, args[1])
        else
            TriggerClientEvent('notification', source, 'Araç modeli girmelisin', 3)
        end
    end
end)

RegisterCommand('tpvehicle', function (source, args)
    if args[1] then
        if Vehicles[args[1]] then
            local coords = {
                x = Vehicles[args[1]].data.coords.x,
                y = Vehicles[args[1]].data.coords.y,
                z = Vehicles[args[1]].data.coords.z
            }
            TriggerClientEvent('mx-vehiclekey:TpVehicle', source, coords)
        else
            TriggerClientEvent('notification', source, 'Araç bulunamadı', 3)
        end
    end
end)

RegisterNetEvent('mx-vehiclekey:UpdateVehicleGps')
AddEventHandler('mx-vehiclekey:UpdateVehicleGps', function(data, plate)
    local src = source
    local player = MX.GetPlayerFromId(src)
    if player then
        local item = player.PlayerData.items[data.slot]
        item.info = {}
        item.info.plate = plate
        player.SetInventory(player.PlayerData.items)
    end
end)

ESX.RegisterServerCallback('mx-vehiclekey:GetImpounds', function(source, cb)
    local player = ESX.GetPlayerFromId(source)
    Sql:execute("SELECT * FROM bbvehicles WHERE identifier = '"..player.citizenid.."'", {}, function (result)
        if #result ~= 0 then
            cb(result)
        else
            cb(nil)
        end
    end)
end)

ESX.RegisterServerCallback('mx-vehiclekey:GetVehicleData', function(source, cb, plate)
    local player = ESX.GetPlayerFromId(source)
    if Vehicles[plate] then
        cb(true)
    else
        cb(false)
    end
end)

RegisterNetEvent('mx-vehiclekey:CreateImpoundData')
AddEventHandler('mx-vehiclekey:CreateImpoundData', function(data)
    local src = source
    local player = ESX.GetPlayerFromId(src)
    local playerx = MX.GetPlayerFromId(src)
    local entity = GetVehicleFromPlate(data.data.props.plate)
    if not entity then print('LINE 203 NOT ENTITY VALUE') end
    Sql:execute('SELECT * FROM bbvehicles WHERE plate = @plate', {
        ['@plate'] = data.data.props.plate
    }, function(result)
        if result and result[1] then
            local info = {}
            info.uniq = 'MX-'..tostring(RandomInt(tonumber('4')) .. RandomInt(tonumber('3')) .. RandomInt(tonumber('2')) .. RandomInt(tonumber('3')) .. RandomStr(tonumber('4')))
            info.plate = data.data.props.plate
            info.owner = player.citizenid

            data.data.props = json.decode(result[1].props)
            data.data.uniq = info.uniq
            Vehicles[data.data.props.plate] = {
                owner = result[1].identifier,
                plate = result[1].plate,
                data = data.data,
                entity = entity
            }

            Sql:execute('INSERT INTO mx_vehicles (owner, plate, data, entity) VALUES (@owner, @plate, @data, @entity)', {
                ['@owner'] = result[1].identifier,
                ['@plate'] = data.data.props.plate,
                ['@data'] = json.encode(Vehicles[data.data.props.plate].data),
                ['@entity'] = entity
            })
            Citizen.Wait(100)
            playerx.addItem('vehiclekey', tonumber('1'), false, info)
            playerx.addItem('vehiclekey', tonumber('1'), false, info) 
            Sql:execute("DELETE FROM bbvehicles WHERE plate = '"..data.data.props.plate.."'", {})
        end
    end)
end)

RegisterNetEvent('mx-vehiclekey:TakeImpound')
AddEventHandler('mx-vehiclekey:TakeImpound', function (data)
    local src = source
    local player = ESX.GetPlayerFromId(src)

    if player then
        if player.getMoney() >= 250 then
            player.removeMoney(250)
            local veri = {}
            veri.data = {
                props = data.props,
                coords = {
                    x = 491.09,
                    y = -1313.07,
                    z = 29.26,
                    h = 299.74
                }
            }
            TriggerClientEvent('mx-vehiclekey:CreateImpoundVehicle', src, veri)
        else
            player.showNotification('Yeterli paran yok')
        end
    end
end)

RegisterNetEvent('mx-vehiclekey:CreateNewKey')
AddEventHandler('mx-vehiclekey:CreateNewKey', function (data)
    local src = source
    local player = ESX.GetPlayerFromId(src)
    local playerx = MX.GetPlayerFromId(src)
    if player then
        if player.getMoney() >= 6000 then
            player.removeMoney(6000)
            local info = {}
            info.uniq = 'MX-'..tostring(RandomInt(tonumber('4')) .. RandomInt(tonumber('3')) .. RandomInt(tonumber('2')) .. RandomInt(tonumber('3')) .. RandomStr(tonumber('4')))
            info.plate = data.plate
            info.owner = player.citizenid
            Vehicles[data.plate].data.uniq = info.uniq
            playerx.addItem('vehiclekey', tonumber('1'), false, info)
            playerx.addItem('vehiclekey', tonumber('1'), false, info)
        else
            player.showNotification('Yeterli paran yok')
        end
    end
end)

function GetVehicleFromPlate(plate)
    local vehicles = GetAllVehicles()
    for i = 1, #vehicles do
        if GetVehicleNumberPlateText(vehicles[i]) == plate then
            return vehicles[i]
        end
    end
    return false 
end

RegisterCommand('araccek', function (source, args)
    local player = ESX.GetPlayerFromId(source)
    if player.getJob().name == 'police' then
        if args[1] then
            if Vehicles[args[1]] then
                Sql:execute("SELECT plate FROM mx_vehicles WHERE plate = '"..args[1].."'", {}, function (result)
                    if result and result[1] then
                        Sql:execute("DELETE FROM mx_vehicles WHERE plate = '"..args[1].."'", {})
                        Sql:execute("INSERT INTO bbvehicles (identifier, plate, props) VALUES ('"..Vehicles[args[1]].owner.."', '"..result[1].plate.."', '"..json.encode(Vehicles[args[1]].data.props).."')")
                        Vehicles[result[1].plate] = nil
                        TriggerClientEvent('mx-vehiclekey:DeleteVehicle', source, result[1].plate)
                    end
                end)
            else
                TriggerClientEvent('notification', source, 'Bu araç bir oyuncuya ait değil .', 3)
            end
        else
            TriggerClientEvent('notification', source, 'Plaka Girmelisin.', 3)
        end
    else
        TriggerClientEvent('notification', source, 'Bu komutu kullanabilmek için polis olmalısın.', 3)
    end
end)

RegisterNetEvent('mx-vehiclekey:CreatedVehicle')
AddEventHandler('mx-vehiclekey:CreatedVehicle', function(data)
    local src = source
    if next(data) then
        for i = 1, #data do
            local entity = GetVehicleFromPlate(data[i].plate)
            if not entity then print('LINE 326 NOT ENTITY VALUE !') end
            if Waiting[src] then
                if not Vehicles[data[i].plate] then
                    TriggerClientEvent('mx-vehiclekey:DeleteVehicle', src, data[i].plate)
                else
                    Vehicles[data[i].plate].entity = entity
                end
            end   
        end
    end
    Waiting[src] = nil
end)

RegisterNetEvent('mx-vehiclekey:CreateVehicleData')
AddEventHandler('mx-vehiclekey:CreateVehicleData', function (data)
    local src = source
    local player = ESX.GetPlayerFromId(src)
    local entity = GetVehicleFromPlate(data.plate)
    if not entity then print('LINE 345 NOT ENTITY VALUE') end
    Vehicles[data.plate] = {
        owner = player.citizenid,
        plate = data.plate,
        entity = entity,
        data = data.data
    }
end)

RegisterNetEvent('baseevents:leftVehicle')
AddEventHandler('baseevents:leftVehicle', function(currentVeh, seat, displayName)
    local src = source
    if seat == -1 then

        TriggerClientEvent('mx-vehiclekey:SaveCoords', src, currentVeh)
    end
end)

ESX.RegisterServerCallback('mx-vehiclekey:GetMyVehicles', function(source, cb)
    local player = ESX.GetPlayerFromId(source)
    local data = {}
    for k,v in next, Vehicles do
        if v.owner == player.citizenid then
            data[k] = Vehicles[k]
        end
    end
    Wait(150)
    if next(data) ~= nil then
        cb(data)
    else
        cb(nil)
    end
end)

RegisterNetEvent('mx-vehiclekey:CreateKey')
AddEventHandler('mx-vehiclekey:CreateKey', function (data)
    local src = source
    local player = MX.GetPlayerFromId(src)
    if player then
        local entity = GetVehicleFromPlate(data.plate)
        if not entity then print('LINE 384 NOT ENTITY VALUE') end
        local info = {}
        info.uniq = 'MX-'..tostring(RandomInt(tonumber('4')) .. RandomInt(tonumber('3')) .. RandomInt(tonumber('2')) .. RandomInt(tonumber('3')) .. RandomStr(tonumber('4')))
        info.plate = data.plate
        info.owner = player.PlayerData.citizenid
        data.data.uniq = info.uniq
        data.owner = player.PlayerData.citizenid
        player.addItem('vehiclekey', tonumber('1'), false, info)
        player.addItem('vehiclekey', tonumber('1'), false, info)
        Vehicles[data.plate] = data
        Vehicles[data.plate].entity = entity
        Sql:execute("INSERT INTO mx_vehicles (owner, plate, entity, data) VALUES ('"..player.PlayerData.citizenid.."', '"..data.plate.."', '"..entity.."', '"..json.encode(data.data).."')", {})
    end
end)

RegisterNetEvent('mx-vehiclekey:SaveCoords')
AddEventHandler('mx-vehiclekey:SaveCoords', function(plate, coords, h, props)
    if Vehicles[plate] then
        local data = Vehicles[plate].data
        if data.coords.x ~= coords.x or data.coords.y ~= coords.y or data.coords.z ~= coords.z or data.h ~= h then
            data.coords = {x = coords.x, y = coords.y, z = coords.z, h = h}
            data.props = props
            local entity = GetVehicleFromPlate(plate)
            if not entity then print('LINE 403 NOT ENTITY VALUE') end
            Sql:execute("UPDATE mx_vehicles SET entity = '"..entity.."', data = '"..json.encode(data).."' WHERE plate = '"..plate.."'")
        end
    end
end)

function Tablelength(table)
    local count = 0
    for _ in pairs(table) do count = count + 1 end
    return count
end

function GetClosestPlayerToCoords(coords, distance)
    local closestDist
    local players = ESX.GetPlayers()
    for i = 1, #players do
        if DoesEntityExist(GetPlayerPed(players[i])) then
            local ped = GetPlayerPed(players[i])
            if ped > 0 then
                closestPlayerId = players[i]
                closestDist = #(vec3(coords.x, coords.y, coords.z) - GetEntityCoords(ped))
                if closestDist <= distance then
                    return closestPlayerId
                end
            end
        end
    end
    return closestPlayerId
end

function SpawnVehicle()
    local created = 0
    local requests = 0
    local tab = {}
    for k,v in next, Vehicles do
        Wait(150)
        if not GetVehicleFromPlate(v.plate) then
            requests = requests + 1
            if requests % 3 == 0 then
                Citizen.Wait(0)
            end
            local closestPlayerId = GetClosestPlayerToCoords(v.data.coords, 400)
            if closestPlayerId then
                if closestPlayerId and not tab[closestPlayerId] then
                    tab[closestPlayerId] = {}
                    created = created + 1
                end
                
                if #tab[closestPlayerId] < 51 then
                    table.insert(tab[closestPlayerId], v)
                end
            end
        end
    end

    if created > 0 then
        Citizen.Wait(0)
        for plyid, vehicleData in pairs(tab) do
            if DoesEntityExist(GetPlayerPed(plyid)) then
                TriggerClientEvent('mx-vehiclekey:CreateVehicles', plyid, vehicleData)
                Waiting[plyid] = true
            end
        end
    end

    local wait = 0
    repeat
        Citizen.Wait(100)
        wait = wait + 1
    until Tablelength(Waiting) == 0 or wait == 60
end

function SaveCoords()
    for k,v in pairs(Vehicles) do
        local entity = GetVehicleFromPlate(v.plate)
        if entity then
            local coords = GetEntityCoords(entity)
            local heading = GetEntityHeading(entity)
            if entity and coords and heading then
                Vehicles[k].data.coords = {x = coords.x, y = coords.y, z = coords.z, h = heading}
                Sql:execute("UPDATE mx_vehicles SET data = '"..json.encode(Vehicles[k].data).."', entity = '"..v.entity.."' WHERE plate = '"..v.plate.."'")
            end
        else
            print(v.plate..' Plakalı aracın kordinatları kaydedilemedi !')
        end
    end
end

function SaveCoordsOnlyData()
    for k,v in pairs(Vehicles) do
        if v.entity and DoesEntityExist(v.entity) then
            local plate = GetVehicleNumberPlateText(v.entity)
            local coords = GetEntityCoords(v.entity)
            local heading = GetEntityHeading(v.entity)
            if plate and coords and heading then
                local data = Vehicles[k].data
                data.coords = {x = coords.x, y = coords.y, z = coords.z, h = heading}
            end
        end
    end
end

Citizen.CreateThread(function()
    while true do
        Citizen.Wait(1500)
        SpawnVehicle()
    end
end)

Citizen.CreateThread(function()
    while true do
     Wait(25000)
     SaveCoordsOnlyData()
    end
end)

RegisterCommand('KaydetLan', function()
    SaveCoords()
end)

Citizen.CreateThread(function()
    while true do
        Citizen.Wait(90000)
        SaveCoords()
    end
end)