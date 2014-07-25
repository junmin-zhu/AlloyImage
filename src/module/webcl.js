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
;(function(Ps){

    window[Ps].module("webcl",function(P){

        var NO_WebCL_FOUND = "Unfortunately your system does not support WebCL";
        var NO_PLATFORM_FOUND = "No WebCL platform found in your system";
        var NO_DEVICE_FOUND = "No WebCL device found in your system";
        var EXTENSION_NOT_SUPPORTED = "Extension is not supported";
        var INVALID_SEQUENCE = "Context is null, you must create a context " +
                "before call createWebCLProgram";

        /* Global vars */
        var platforms , devices , context = null, program = null, queue = null;

        var cl;
        if (typeof(webcl) != "undefined") {
            cl = webcl;
        } else if (typeof(WebCL) != "undefined") {
            cl = new WebCL();
        }

        var scripts = document.getElementsByTagName( 'script' );
        var clPath = scripts[scripts.length - 1].src.replace('alloyimage.js', 'kernel.cl');

        /* API */
        var WebCLCommon = {

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
                        console.log("GPU");
                        break;

                    case "ALL":
                        /* It is importante keep DEVICE_TYPE_CPU always above to make it
                         * default device (devices[0]) */
                        devices = platforms[i].getDevices(cl.DEVICE_TYPE_GPU);
                        devices = platforms[i].getDevices(cl.DEVICE_TYPE_CPU);
                        console.log("ALL");
                        break;

                    default:
                        throw new Error("Unexpected type " + type + " for devices");
                    }
                }

                if (devices.length === 0) {
                    throw new Error(NO_DEVICE_FOUND);
                }

                context = this.createContext();
                queue = this.createCommandQueue();
                var src = this.loadKernel(clPath);
                program = this.createProgramBuild(src);
                kernel = program.createKernel("sobel_filter");
            },

            /**
             * Create a WebCLContex
             *
             * @param {WebCLContextProperties} props
             * @returns {WebCLContext} context
             */
            createContext : function () {
                var ctx;
                try {
                    ctx = cl.createContext(devices);
                } catch (e) {
                    if (debug) {
                        console.error(e);
                    }
                    throw e;
                }

                return ctx;
            },

            /**
             * Return a device list according required type
             * ALL, CPU or GPU are valid inputs
             *
             * @returns {WebCLDevice[]} devices
             */
            getDevices : function () {
                return devices;
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
                var pm;
                try {
                    if (!context) {
                        throw new Error(INVALID_SEQUENCE);
                    }

                    pm = context.createProgram(src);

                } catch (e) {
                    if (debug) {
                        console.error(e);
                    }
                    throw e;
                }

                return pm;
            },

            createCommandQueue : function () {

                var cmdQueue;
                try {
                    cmdQueue = context.createCommandQueue(devices, null);
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
             * @returns {WebCLProgram} program
             */
            createProgramBuild : function (src) {
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
        return WebCLCommon;
    });
})("psLib");
