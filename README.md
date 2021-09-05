# mx-vehiclekey

# About the script
- Where you park your car stays there.
- The plate is given a special key. With this key, you can lock and unlock the door while outside the vehicle. While in the vehicle, you turn the vehicle's engine on and off.
- When you connect the GPS system to your vehicle, the location of your vehicle appears as a circle on the map. It does not give the exact coordinate! your vehicle is located within the specified circle.
- If the person loses the vehicle key, they can get a new key. 

# Showcase
https://www.youtube.com/watch?v=Xr1MCPFXKsE

# Commands
- With the /impound command, players with the job you have specified in the config can tow the vehicle.
- /hotwire u know : )
- Can give the car to someone with the /givecar command. Usage: /givecar id

# Installation

You must make these changes when the vehicle is purchased on esx_vehicleshop
Replace esx_vehicleshop:setVehicleOwned with this >
```lua
TriggerServerEvent('mx-vehiclekey:AddVehicle', {
	props = vehicleProps,
	coords = {
		x = Config.Zones.ShopOutside.Pos.x,
		y = Config.Zones.ShopOutside.Pos.y,
		z = Config.Zones.ShopOutside.Pos.z,
		h = Config.Zones.ShopOutside.Heading
	}
})
```

before: 
```lua
TriggerServerEvent('esx_vehicleshop:setVehicleOwned', vehicleProps)
```
after:
```lua
TriggerServerEvent('mx-vehiclekey:AddVehicle', {
	props = vehicleProps,
	coords = {
		x = Config.Zones.ShopOutside.Pos.x,
		y = Config.Zones.ShopOutside.Pos.y,
		z = Config.Zones.ShopOutside.Pos.z,
		h = Config.Zones.ShopOutside.Heading
	}
})
```

If the vehicle is modified, you should trigger it. Check line 330 on server.ts for example usage.
```lua
TriggerServerEvent('mx-vehiclekey:UpdateVehicleProps', props)
```


# Questions:
#### Can I use my old cars on this script?
- Yes, you can. Players can buy vehicles on owned_vehicles from withdrawns. If you are using sql other than owned_vehicles you need to make some changes.

# Requirements
- OneSync and linden_inventory,
- If you want to develop this system, you should have `npm` on your computer. Download the modules on the script by typing `npm i` and start developing the code by typing `npm run build`!
- If you are using an old version of linden_inventory, change the 'ox_inventory' fields on the script to `linden_inventory`.

- You should add these items on linden_inventory:
```lua
['vehiclekey'] = {
	label = 'Vehicle Key',
	weight = 0.1,
	stack = false,
	close = true,
	client = {
		usetime = 0,
		event = 'mx-vehiclekey:UseKey',
	}
},
['vehiclegps'] = {
	label = 'Vehicle Gps',
	weight = 0.1,
	stack = false,
	close = true,
	client = {
		usetime = 0,
		event = 'mx-vehiclekey:CreateVehicleGps',
	}
},

- You should add vehiclegps item to your market.
```
