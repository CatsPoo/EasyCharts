export enum AI_TOOLS{
    LIST_CHARTS="list_charts", //get list of all avail able charts for the current user
    GET_CHART="get_chart", // get full information of the wanted chart
    CREATE_CHART="create_chart", // create new chart on database, required before edit the chart

    LIST_DEVICES="list_devices", //get list of all available devices
    GET_DEVICE="get_device", // get full detaild about the wanted device
    //CREATE_DEVICE="create_device", //not nedded for now
    CREATE_DEVICE_PORT="create_device_port", //create new port on spesific devcie, need to ask what is the port type and its name

    LIST_DIRECTORIES="list_directories", //list all available directories
    LIST_DIRECTORY_CONTENT="list_directory_content", // list all directory content

    //all thi ui_* tools tell the front end to mafe changes on the spesific chart that now open in the chart editor on edit mode
    UI_OPEN_CHART="ui_open_chart", // tell the ui to open spisific chart on chart editor
    UI_ADD_DEVICEs_TO_CAHRT="ui_add_device_to_chart", //tel the ui to add device to chart, only on edit mode
    UI_remove_DEVICEs_from_CAHRT="ui_remove_device_from_chart", //tell the ui to remove device from chart, only on edit mode
    UI_MOVE_DEVICEs_ON_CHART="ui_move_device_on_chart", //tell the ui to change the position of device on the chart

    UI_CONNECT_DEVICES_PORTS="ui_connect_devices_ports", //tell the ui to create new line between 2 ports
    UI_DISCONNECT_DEVICES_PORTS="ui_disconnect_devices_ports", // tell the ui to remove line between 2 ports in the specific chart
    
    UI_GET_CURRENT_CHART_STATE="ui_get_current_chart_state", //get the current chart state on the chart editor (used to trac user manual changes that not saved on the database yet)

    UI_ADD_PORT_TO_DEVICE_ON_CHART='ui_add_port_to_device_on_chart'
}