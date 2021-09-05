/*! For license information please see S_main.js.LICENSE.txt */
(()=>{"use strict";var __webpack_modules__={"./src/server/s_lb.ts":function(__unused_webpack_module,exports){eval("\r\nvar __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {\r\n    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }\r\n    return new (P || (P = Promise))(function (resolve, reject) {\r\n        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }\r\n        function rejected(value) { try { step(generator[\"throw\"](value)); } catch (e) { reject(e); } }\r\n        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }\r\n        step((generator = generator.apply(thisArg, _arguments || [])).next());\r\n    });\r\n};\r\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\r\nexports.Execute = exports.Fetch = exports.Wait = exports.MathRandom = exports.ArrayToVec3 = exports.IsJson = exports.SplitSpaces = exports.CalculateDistance = void 0;\r\nconst CalculateDistance = (p1, p2) => __awaiter(void 0, void 0, void 0, function* () {\r\n    var a = p2.x - p1.x;\r\n    var b = p2.y - p1.y;\r\n    var c = p2.z - p1.z;\r\n    return Math.sqrt(a * a + b * b + c * c);\r\n});\r\nexports.CalculateDistance = CalculateDistance;\r\nfunction SplitSpaces(a) {\r\n    a = String(a);\r\n    return a.split(' ').join('');\r\n}\r\nexports.SplitSpaces = SplitSpaces;\r\nfunction IsJson(str) {\r\n    try {\r\n        JSON.parse(str);\r\n    }\r\n    catch (e) {\r\n        return false;\r\n    }\r\n    return true;\r\n}\r\nexports.IsJson = IsJson;\r\nfunction ArrayToVec3(coords) {\r\n    return {\r\n        x: coords[0],\r\n        y: coords[1],\r\n        z: coords[2],\r\n    };\r\n}\r\nexports.ArrayToVec3 = ArrayToVec3;\r\nconst MathRandom = (min, max) => __awaiter(void 0, void 0, void 0, function* () {\r\n    return Math.floor(Math.random() * (max - min + 1) + min);\r\n});\r\nexports.MathRandom = MathRandom;\r\nconst Wait = (ms) => new Promise(res => setTimeout(res, ms));\r\nexports.Wait = Wait;\r\nconst Fetch = (query, params) => __awaiter(void 0, void 0, void 0, function* () {\r\n    let res = {};\r\n    let finishedQuery = false;\r\n    globalThis.exports['mysql-async'].mysql_fetch_all(query, params, function (result) {\r\n        finishedQuery = true;\r\n        res = result;\r\n    });\r\n    while (!finishedQuery) {\r\n        yield (0, exports.Wait)(100);\r\n    }\r\n    return res;\r\n});\r\nexports.Fetch = Fetch;\r\nconst Execute = (query, params) => __awaiter(void 0, void 0, void 0, function* () {\r\n    let res = {};\r\n    let finishedQuery = false;\r\n    globalThis.exports['mysql-async'].mysql_execute(query, params, function (result) {\r\n        finishedQuery = true;\r\n        res = result;\r\n    });\r\n    while (!finishedQuery) {\r\n        yield (0, exports.Wait)(100);\r\n    }\r\n    return res;\r\n});\r\nexports.Execute = Execute;\r\n\n\n//# sourceURL=webpack://vehiclekey/./src/server/s_lb.ts?")},"./src/server/server.ts":function(__unused_webpack_module,exports,__webpack_require__){eval("\r\nvar __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {\r\n    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }\r\n    return new (P || (P = Promise))(function (resolve, reject) {\r\n        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }\r\n        function rejected(value) { try { step(generator[\"throw\"](value)); } catch (e) { reject(e); } }\r\n        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }\r\n        step((generator = generator.apply(thisArg, _arguments || [])).next());\r\n    });\r\n};\r\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\r\nconst s_lb_1 = __webpack_require__(/*! ./s_lb */ \"./src/server/s_lb.ts\");\r\nlet ESX;\r\nlet Vehicles = [], InProgress;\r\nemit('esx:getSharedObject', obj => (ESX = obj));\r\nconst GetVehicles = () => __awaiter(void 0, void 0, void 0, function* () {\r\n    yield (0, s_lb_1.Wait)(2000);\r\n    const result = yield (0, s_lb_1.Fetch)('SELECT * FROM mx_vehicles', {});\r\n    Vehicles = result && [result].length > 0 && JSON.parse(JSON.stringify(result)) || {};\r\n});\r\nGetVehicles();\r\nconst SpawnVehicles = () => __awaiter(void 0, void 0, void 0, function* () {\r\n    let closestplayerid, spawnlist = [];\r\n    for (const veh of Vehicles) {\r\n        if ((veh && veh.data && veh.data.props) && !veh.entity || !DoesEntityExist(veh.entity)) {\r\n            veh.data = (0, s_lb_1.IsJson)(veh.data) && JSON.parse(veh.data) || veh.data;\r\n            if (!(yield GetEntityFromPlate(veh.data.props.plate))) {\r\n                if (yield GetClosestPlayer((0, s_lb_1.IsJson)(veh.data) && JSON.parse(veh.data).coords || veh.data.coords, 400)) {\r\n                    closestplayerid = yield GetClosestPlayer((0, s_lb_1.IsJson)(veh.data) && JSON.parse(veh.data).coords || veh.data.coords, 400);\r\n                    spawnlist.push({\r\n                        veh_data: veh.data,\r\n                        player_id: closestplayerid\r\n                    });\r\n                }\r\n            }\r\n            else {\r\n                veh.entity = yield GetEntityFromPlate(veh.data.props.plate);\r\n            }\r\n        }\r\n    }\r\n    if (spawnlist.length > 0) {\r\n        if (closestplayerid && GetPlayerPed(closestplayerid) > 0) {\r\n            emitNet('mx-vehiclekey:SpawnVehicles', closestplayerid, spawnlist);\r\n            InProgress = true;\r\n        }\r\n    }\r\n    let wait = 0;\r\n    while (true) {\r\n        yield (0, s_lb_1.Wait)(1000);\r\n        if (wait > 5000 || !InProgress) {\r\n            break;\r\n        }\r\n        wait + 1000;\r\n    }\r\n    yield (0, s_lb_1.Wait)(2000);\r\n});\r\nonNet('mx-vehiclekey:SpawnedVehicles', (data) => __awaiter(void 0, void 0, void 0, function* () {\r\n    const src = __webpack_require__.g.source;\r\n    for (let i = 0; i < data.length; i++) {\r\n        if (data[i].veh_data.impound) {\r\n            const result = yield (0, s_lb_1.Fetch)('SELECT * FROM owned_vehicles WHERE vehicle LIKE @plate', { ['@plate']: '%' + data[i].veh_data.props.plate + '%' });\r\n            if (result && result[0]) {\r\n                CreateNewkey(src, { props: {\r\n                        plate: data[i].veh_data.props.plate\r\n                    } });\r\n                yield AddNewVehicle(src, data[i].veh_data);\r\n                yield (0, s_lb_1.Execute)(`DELETE FROM owned_vehicles WHERE vehicle LIKE '%${data[i].veh_data.props.plate}%'`, {});\r\n            }\r\n        }\r\n        yield SetSpawned(data[i].veh_data.props.plate);\r\n    }\r\n    InProgress = null;\r\n}));\r\nESX.RegisterServerCallback('mx-vehiclekey:GetImpounds', (source, cb) => __awaiter(void 0, void 0, void 0, function* () {\r\n    const player = ESX.GetPlayerFromId(source);\r\n    const result = yield (0, s_lb_1.Fetch)(`SELECT * FROM owned_vehicles WHERE owner = '${player.identifier}'`, {});\r\n    if ([result].length != 0) {\r\n        cb(JSON.parse(JSON.stringify(result)));\r\n    }\r\n    else {\r\n        cb(null);\r\n    }\r\n}));\r\nonNet('mx-vehiclekey:TakeImpound', function (data) {\r\n    const src = __webpack_require__.g.source;\r\n    const player = ESX.GetPlayerFromId(src);\r\n    if (player) {\r\n        if (player.getMoney() >= 250) {\r\n            player.removeMoney(250);\r\n            const veri = [\r\n                {\r\n                    veh_data: {\r\n                        props: data.props,\r\n                        coords: {\r\n                            x: 491.09,\r\n                            y: -1313.07,\r\n                            z: 29.26,\r\n                            h: 299.74\r\n                        },\r\n                        impound: true\r\n                    }\r\n                }\r\n            ];\r\n            emitNet('mx-vehiclekey:SpawnVehicles', src, veri);\r\n        }\r\n        else {\r\n            player.showNotification(\"you don't have enough money\");\r\n        }\r\n    }\r\n});\r\nconst SetSpawned = (plate) => __awaiter(void 0, void 0, void 0, function* () {\r\n    for (const veh of Vehicles) {\r\n        if (veh && veh.data && veh.data.props) {\r\n            veh.data = (0, s_lb_1.IsJson)(veh.data) && JSON.parse(veh.data) || veh.data;\r\n            if (veh.data.props.plate === plate) {\r\n                veh.entity = yield GetEntityFromPlate(plate);\r\n                break;\r\n            }\r\n        }\r\n    }\r\n});\r\nonNet('mx-vehiclekey:AddVehicle', (data) => __awaiter(void 0, void 0, void 0, function* () {\r\n    const src = __webpack_require__.g.source;\r\n    AddNewVehicle(src, data);\r\n}));\r\nconst AddNewVehicle = (source, data) => __awaiter(void 0, void 0, void 0, function* () {\r\n    const src = source;\r\n    if (data && data.props) {\r\n        try {\r\n            const owner = ESX.GetPlayerFromId(src).identifier;\r\n            yield (0, s_lb_1.Execute)('INSERT INTO mx_vehicles (owner, data) VALUES (@owner, @data)', {\r\n                ['@owner']: owner,\r\n                ['@data']: JSON.stringify(data)\r\n            });\r\n            const result = yield (0, s_lb_1.Fetch)(\"SELECT id FROM mx_vehicles WHERE data LIKE @plate\", {\r\n                ['@plate']: '%' + data.props.plate + '%'\r\n            });\r\n            Vehicles.push({\r\n                owner: owner,\r\n                data: data,\r\n                id: result[0].id\r\n            });\r\n            CreateNewkey(src, data);\r\n        }\r\n        catch (err) {\r\n            console.log('^1 [MX-VEHKEY - ERROR] ^2 ', err.message, '^0');\r\n        }\r\n    }\r\n});\r\nconst GetEntityFromPlate = (plate) => __awaiter(void 0, void 0, void 0, function* () {\r\n    const getvehs = GetAllVehicles();\r\n    for (let i = 0; i < getvehs.length; i++) {\r\n        if ((0, s_lb_1.SplitSpaces)(GetVehicleNumberPlateText(getvehs[i])) === (0, s_lb_1.SplitSpaces)(plate)) {\r\n            return getvehs[i];\r\n        }\r\n    }\r\n    return false;\r\n});\r\nconst GetClosestPlayer = (coords, distance) => __awaiter(void 0, void 0, void 0, function* () {\r\n    let closestped, dst;\r\n    const players = ESX.GetPlayers();\r\n    for (let i = 0; i < players.length; i++) {\r\n        closestped = GetPlayerPed(players[i]);\r\n        if (DoesEntityExist(closestped)) {\r\n            if (closestped && closestped > 0) {\r\n                dst = yield (0, s_lb_1.CalculateDistance)(yield (0, s_lb_1.ArrayToVec3)(GetEntityCoords(closestped)), coords);\r\n                if (dst && dst <= distance) {\r\n                    return players[i];\r\n                }\r\n            }\r\n        }\r\n    }\r\n    return false;\r\n});\r\nconst CreateNewkey = (source, data) => {\r\n    const src = source;\r\n    const player = ESX.GetPlayerFromId(src);\r\n    try {\r\n        let info = {\r\n            plate: data.props.plate,\r\n            owner: player.identifier,\r\n            description: 'Plate ' + data.props.plate\r\n        };\r\n        player.addInventoryItem('vehiclekey', 1, info);\r\n    }\r\n    catch (err) {\r\n        console.log(err.message);\r\n    }\r\n};\r\nconst UpdateVehiclesData = () => __awaiter(void 0, void 0, void 0, function* () {\r\n    yield (0, s_lb_1.Wait)(2000);\r\n    let entitycoords;\r\n    for (const veh of Vehicles) {\r\n        if (veh && veh.entity && DoesEntityExist(veh.entity)) {\r\n            entitycoords = {\r\n                x: (0, s_lb_1.ArrayToVec3)(GetEntityCoords(veh.entity)).x,\r\n                y: (0, s_lb_1.ArrayToVec3)(GetEntityCoords(veh.entity)).y,\r\n                z: (0, s_lb_1.ArrayToVec3)(GetEntityCoords(veh.entity)).z,\r\n                h: GetEntityHeading(veh.entity)\r\n            };\r\n            veh.data.coords = entitycoords;\r\n        }\r\n    }\r\n});\r\nESX.RegisterServerCallback('mx-vehiclekey:GetVehicleFromPlate', (source, cb, plate) => __awaiter(void 0, void 0, void 0, function* () {\r\n    const Vehicle = yield GetVehicleFromPlate(plate);\r\n    cb(Vehicle);\r\n}));\r\nconst GetVehicleFromPlate = (plate) => __awaiter(void 0, void 0, void 0, function* () {\r\n    for (const veh of Vehicles) {\r\n        if (veh && veh.data && veh.data.props) {\r\n            if ((0, s_lb_1.SplitSpaces)(veh.data.props.plate) === (0, s_lb_1.SplitSpaces)(plate)) {\r\n                return veh;\r\n            }\r\n        }\r\n    }\r\n    return false;\r\n});\r\nonNet('mx-vehiclekey:DestroyVehicle', (plate) => __awaiter(void 0, void 0, void 0, function* () {\r\n    for (let veh in Vehicles) {\r\n        if (veh && Vehicles[veh]) {\r\n            if ((0, s_lb_1.SplitSpaces)(Vehicles[veh].data.props.plate) === (0, s_lb_1.SplitSpaces)(plate)) {\r\n                const result = yield (0, s_lb_1.Fetch)(`SELECT id FROM mx_vehicles WHERE id = '${Vehicles[veh].id}'`, {});\r\n                if (result && result[0]) {\r\n                    yield (0, s_lb_1.Execute)(`DELETE FROM mx_vehicles WHERE id = '${result[0].id}'`, {});\r\n                    yield (0, s_lb_1.Execute)(`INSERT INTO owned_vehicles (owner, vehicle) VALUES ('${Vehicles[veh].owner}', '${JSON.stringify(Vehicles[veh].data.props)}')`, {});\r\n                    Vehicles[veh] = null;\r\n                }\r\n                break;\r\n            }\r\n        }\r\n    }\r\n}));\r\nlet timer = 0;\r\nconst Spam = () => __awaiter(void 0, void 0, void 0, function* () {\r\n    while (true) {\r\n        timer++;\r\n        yield (0, s_lb_1.Wait)(100);\r\n        if (timer > 25) {\r\n            timer = 0;\r\n            break;\r\n        }\r\n    }\r\n});\r\nlet myVehicles = [];\r\nESX.RegisterServerCallback('mx-vehiclekey:GetMyVehicles', (source, cb) => __awaiter(void 0, void 0, void 0, function* () {\r\n    if (timer === 0) {\r\n        myVehicles = [];\r\n        const player = ESX.GetPlayerFromId(source);\r\n        for (const veh of Vehicles) {\r\n            if (veh) {\r\n                veh.data = (0, s_lb_1.IsJson)(veh.data) && JSON.parse(veh.data) || veh.data;\r\n                if (veh.owner == player.identifier) {\r\n                    myVehicles.push({\r\n                        plate: veh.data.props.plate\r\n                    });\r\n                }\r\n            }\r\n        }\r\n        if (myVehicles.length > 0) {\r\n            cb(myVehicles);\r\n        }\r\n        else {\r\n            cb(null);\r\n        }\r\n        Spam();\r\n    }\r\n    else {\r\n        cb(myVehicles);\r\n    }\r\n}));\r\nonNet('mx-vehiclekey:CreateNewKey', function (data) {\r\n    const src = __webpack_require__.g.source;\r\n    const player = ESX.GetPlayerFromId(src);\r\n    if (player) {\r\n        if (player.getMoney() >= 6000) {\r\n            player.removeMoney(6000);\r\n            CreateNewkey(src, { props: {\r\n                    plate: data.plate\r\n                }\r\n            });\r\n        }\r\n        else {\r\n            player.showNotification(\"you don't have enough money.\");\r\n        }\r\n    }\r\n});\r\nonNet('mx-vehiclekey:GiveCar', (target_id, plate) => __awaiter(void 0, void 0, void 0, function* () {\r\n    const src = __webpack_require__.g.source;\r\n    const player = ESX.GetPlayerFromId(src);\r\n    const target = ESX.GetPlayerFromId(target_id);\r\n    if (source != target_id) {\r\n        if (target) {\r\n            for (let veh in Vehicles) {\r\n                if (veh) {\r\n                    if ((0, s_lb_1.SplitSpaces)(Vehicles[veh].data.props.plate) === (0, s_lb_1.SplitSpaces)(plate)) {\r\n                        if (Vehicles[veh].owner === player.identifier) {\r\n                            Vehicles[veh].owner = target.identifier;\r\n                            yield (0, s_lb_1.Execute)('UPDATE mx_vehicles SET owner = @owner WHERE id = @id', {\r\n                                ['@id']: Vehicles[veh].id,\r\n                                ['@owner']: target.identifier\r\n                            });\r\n                            player.showNotification(`The vehicle with ${plate} was given to ${target_id}.`);\r\n                            break;\r\n                        }\r\n                        else {\r\n                            player.showNotification(\"You don't own this vehicle\");\r\n                        }\r\n                    }\r\n                }\r\n            }\r\n        }\r\n        else {\r\n            player.showNotification(\"Player's not online\");\r\n        }\r\n    }\r\n    else {\r\n        player.showNotification(\"You can't get yourself a car\");\r\n    }\r\n}));\r\nconst UpdateSqlQueries = () => __awaiter(void 0, void 0, void 0, function* () {\r\n    yield (0, s_lb_1.Wait)(15000);\r\n    let selectList;\r\n    for (const veh of Vehicles) {\r\n        if (veh && veh.entity && DoesEntityExist(veh.entity)) {\r\n            if (!selectList) {\r\n                selectList = `UPDATE mx_vehicles u JOIN (SELECT ${veh.id} AS id, '${JSON.stringify(veh.data)}' AS new_data`;\r\n            }\r\n            else {\r\n                selectList = selectList + ' UNION ' + `SELECT ${veh.id} AS id, '${JSON.stringify(veh.data)}' AS new_data`;\r\n            }\r\n        }\r\n    }\r\n    if (!selectList) {\r\n        return false;\r\n    }\r\n    selectList += \") a ON u.id = a.id SET `data` = new_data\";\r\n    yield (0, s_lb_1.Execute)(selectList, {});\r\n});\r\n/* Trigger this to update your vehicle's mod.\r\nExample usage: TriggerServerEvent('mx-vehiclekey:UpdateVehicleProps', ESX.Game.GetVehicleProperties(GetVehiclePedIsIn(PlayerPedId(), false)))\r\n*/\r\nonNet('mx-vehiclekey:UpdateVehicleProps', (props) => __awaiter(void 0, void 0, void 0, function* () {\r\n    if (!props) {\r\n        return false;\r\n    }\r\n    const vehicle = yield GetVehicleFromPlate(props.plate);\r\n    if (!vehicle) {\r\n        return false;\r\n    }\r\n    vehicle.props = props;\r\n}));\r\nonNet('mx-vehiclekey:UpdateVehicleGps', (item, plate) => __awaiter(void 0, void 0, void 0, function* () {\r\n    const src = __webpack_require__.g.source;\r\n    const player = ESX.GetPlayerFromId(src);\r\n    const player_inv = player.getInventory();\r\n    if (player) {\r\n        if (player_inv[item.slot]) {\r\n            player_inv[item.slot].metadata = {\r\n                plate: plate,\r\n                description: 'Plate ' + plate\r\n            };\r\n            emit('ox_inventory:setPlayerInventory', player, player_inv);\r\n        }\r\n    }\r\n}));\r\nsetTick(SpawnVehicles);\r\nsetTick(UpdateVehiclesData);\r\nsetTick(UpdateSqlQueries);\r\n\n\n//# sourceURL=webpack://vehiclekey/./src/server/server.ts?")}},__webpack_module_cache__={};function __webpack_require__(e){var r=__webpack_module_cache__[e];if(void 0!==r)return r.exports;var n=__webpack_module_cache__[e]={exports:{}};return __webpack_modules__[e].call(n.exports,n,n.exports,__webpack_require__),n.exports}__webpack_require__.g=function(){if("object"==typeof globalThis)return globalThis;try{return this||new Function("return this")()}catch(e){if("object"==typeof window)return window}}();var __webpack_exports__=__webpack_require__("./src/server/server.ts")})();