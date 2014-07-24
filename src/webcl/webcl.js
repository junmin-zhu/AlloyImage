/**
 * Some WebCL functions to help with some common or repeated tasks
 * like get context using CPU or GPU, build program and
 * create commandQueue
 *
 * Eg:
 *
 *  WebCLCommon.init("ALL");
 *  var ctx = WebCLCommon.createContext();
 *  var program = WebCLCommon.createProgramBuild(kernelSrc);
 *  var cmdQueue = WebCLCommon.createCommandQueue();
 *
 * @author Alexandre Rocha <alerock@gmail.com>
 */

window.WebCLCommon = (function (debug) {

    "use strict";

    var NO_WebCL_FOUND = "Unfortunately your system does not support WebCL";
    var NO_PLATFORM_FOUND = "No WebCL platform found in your system";
    var NO_DEVICE_FOUND = "No WebCL device found in your system";
    var EXTENSION_NOT_SUPPORTED = "Extension is not supported";
    var INVALID_SEQUENCE = "Context is null, you must create a context " +
            "before call createWebCLProgram";

    /* Global vars */
    var platforms , devices , context = null, program = null;

    var cl;
    if (typeof(webcl) != "undefined") {
        cl = webcl;
    }

    if (typeof(WebCL) != "undefined") {
        cl = new WebCL();
    }

    /**
     * Return devices according required type
     *
     * @param {CLenum} type - CLenum that represents a device type
     */
    var getDevicesPerType = function (type) {
        var deviceList, i;

        try {
            for (i = 0; i < platforms.length; i++) {
                deviceList = platforms[i].getDevices(type);
            }
        } catch (e) {
            if (debug) {
                console.error(e);
            }
            throw e;
        }

        return deviceList;
    };

    /**
     * Populate target with source content
     *
     * @param {Array} source - Array with elements to be copied
     * @param {Array} target - Array where the elements will be placed
     */
    var addElementsFromList = function (source, target) {
        var i;

        if (!source instanceof Array) {
            throw new Error("[source] must be an Array");
        }

        if (!target instanceof Array) {
            throw new Error("[target] must be an Array");
        }

        for (i = 0; i < source.length; i++) {
            target.push(source[i]);
        }
    };

    /* API */
    return {

        /**
         * Check if WebCL is available and populate
         * platforms and devices. Type can be ALL, CPU or GPU.
         *
         */
        init : function (type) {

            var i;

            if (cl === undefined) {
                throw new Error(NO_WebCL_FOUND);
            }

            platforms = cl.getPlatforms();

            if (platforms.length === 0) {
                throw new Error(NO_PLATFORM_FOUND);
            }

            for (i = 0; i < platforms.length; i++) {
                switch (type) {
                case "CPU":
                    devices = platforms[i].getDevices(cl.DEVICE_TYPE_CPU);
                    console.log("CPU");
                    break;

                case "GPU":
                    devices = platforms[i].getDevices(cl.DEVICE_TYPE_GPU);
                    break;

                case "ALL":
                    /* It is importante keep DEVICE_TYPE_CPU always above to make it
                     * default device (devices[0]) */
                    devices = platforms[i].getDevices(cl.DEVICE_TYPE_GPU);
                    devices = platforms[i].getDevices(cl.DEVICE_TYPE_CPU);
                    break;

                default:
                    throw new Error("Unexpected type " + type + " for devices");
                }
            }

            if (devices.length === 0) {
                throw new Error(NO_DEVICE_FOUND);
            }

        },

        /**
         * Create a WebCLContex
         *
         * @param {WebCLContextProperties} props
         * @returns {WebCLContext} context
         */
        createContext : function (props) {
            //var ctxProps = new WebCLContextProperties();
            //var resource;
            //var extension;

            /* Populate ctxProps with default values */
            //ctxProps.platform = (props && props.platform) ? props.platform : platforms[0];
            //ctxProps.devices = (props && props.devices) ? props.devices : devices;
            //ctxProps.deviceType = (props && props.deviceType) ? props.deviceType :  cl.DEVICE_TYPE_CPU;
            //ctxProps.hint = (props && props.hint) ? props.hint : null;

            /* Checking for possible extensions*/
            //resource = (props && props.extension) ? props.extension : null;

            try {
                /*if (resource) {
                    extension = cl.getExtension(resource);
                    if (!extension) {
                        throw new Error(EXTENSION_NOT_SUPPORTED);
                    }
                    context = extension.createContext(ctxProps);
                } else {
                    context = cl.createContext(ctxProps);
                }*/
                context = cl.createContext(devices);
            } catch (e) {
                if (debug) {
                    console.error(e);
                }
                throw e;
            }

            return context;
        },

        /**
         * Return a device list according required type
         * ALL, CPU or GPU are valid inputs
         *
         * @param {String} type - CPU, GPU
         * @returns {WebCLDevice[]} devices
         */
        getDevices : function (type) {

            switch (type) {

            case "ALL":
                return devices;

            case "CPU":
                return getDevicesPerType(cl.DEVICE_TYPE_CPU);

            case "GPU":
                return getDevicesPerType(cl.DEVICE_TYPE_GPU);

            default:
                throw new Error("Unknow device type " + type);
            }
        },

        getCL : function() {
            return cl;
        },

        /**
         * Return all platforms available
         *
         * @return {WebCLPlatforms[]} platforms
         */
        getPlatforms : function () {
            return platforms;
        },

        /**
         * Create WebCLProgram using the global WebCLCommon context
         *
         * @param {String} src - OpenCL code source
         * @returns {WebCLProgram} program
         */
        createProgram : function (src) {

            try {
                if (!context) {
                    throw new Error(INVALID_SEQUENCE);
                }

                program = context.createProgram(src);

            } catch (e) {
                if (debug) {
                    console.error(e);
                }
                throw e;
            }

            return program;
        },

        createCommandQueue : function (deviceList) {

            var cmdQueue;
            try {
                //devices = platforms[0].getDevices(cl.DEVICE_TYPE_CPU);
                cmdQueue = context.createCommandQueue(deviceList || devices, null);
            } catch (e) {
                if (debug) {
                    console.error(e);
                }
                throw e;
            }

            return cmdQueue;
        },

        /**
         * Create WebCLProgram using the global WebCLCommon context
         * and buid the kernel source
         *
         * @param {String} src - OpenCL code source
         * @param {WebCLDevice[]} deviceList - Optional. If null, devices[0] will be used
         * @returns {WebCLProgram} program
         */
        createProgramBuild : function (src, deviceList) {
            var program;

            try {
                program  = this.createProgram(src);
                program.build(devices, null, null);
            } catch (e) {
                if (debug) {
                    console.error(e);
                }
                throw e;
            }

            return program;
        },

        /**
         * Set global WebCLCommon.debug to true
         *
         */
        setDebugOn : function () {
            debug = true;
        },

        /**
         * Set global WebCLCommon.debug to false
         *
         */
        setDebugOff : function () {
            debug = false;
        },

        /**
         * Load the kernel file and return its content
         *
         * @param {String} filePath - Kernel file (*.cl) path
         * @returns {String} File content
         */
        loadKernel : function (filePath) {
            var res = null;
            var xhr = new XMLHttpRequest();
            xhr.open("GET", filePath, false);
            xhr.send();
            // HTTP reports success with a 200 status, file protocol reports
            // success with a 0 status
            if (xhr.status === 200 || xhr.status === 0) {
                res = xhr.responseText;
            }
            return res;
        }
    };

}());
