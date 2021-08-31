fx_version 'cerulean'
games { 'gta5' }
client_scripts {
    'client/main.lua'
}

server_scripts {
    'server/main.lua'
}

ui_page 'html/main.html'

files ({
    'html/*'
})

client_script '@mei-errorlog/client/cl_errorlog.lua'