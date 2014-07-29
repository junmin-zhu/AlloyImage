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
        var debug = true;
        var NO_WebCL_FOUND = "Unfortunately your system does not support WebCL";
        var NO_PLATFORM_FOUND = "No WebCL platform found in your system";
        var NO_DEVICE_FOUND = "No WebCL device found in your system";
        var EXTENSION_NOT_SUPPORTED = "Extension is not supported";
        var INVALID_SEQUENCE = "Context is null, you must create a context " +
                "before call createWebCLProgram";

        /* Global vars */
        var platforms , devices , context = null, program = null, queue = null;
        /* Global memory objects */
        var inputBuffer = null, outputBuffer = null;
        /* Global kernels as mapped type */
        var kernels = {"darkCorner": null};
        /* Global work size */
        var globalThreads = null;

        /* result and image info*/
        var result, originImg, nRGBA, nBytes;

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
            init : function (type, imgData) {

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
                originImg = imgData;
                
                for (kernelName in kernels) 
                    kernels[kernelName] = program.createKernel(kernelName);

                /* Create Buffer of WebCL need bytes in size, and cannot get throug
                 * js api but this transfer imgData which from context.getImageData
                 * API call and the format of pixel is RGBA and each element stand for
                 * values of R or G or B or A, so each element is 8 bytes
                 */
                nRGBA = imgData.width * imgData.height * 4;
                nBytes = nRGBA * Float32Array.BYTES_PER_ELEMENT;
                inputBuffer = context.createBuffer(cl.MEM_READ_ONLY, nBytes,
                                                   new Float32Array(imgData.data));
                outputBuffer = context.createBuffer(cl.MEM_READ_WRITE, nBytes);
                result = new Float32Array(nRGBA);
                globalThreads = [imgData.width, imgData.height];
            },

            run :  function (kernelName, args) {
                    kernels[kernelName].setArg(0, inputBuffer);
                    kernels[kernelName].setArg(1, outputBuffer);
                    kernels[kernelName].setArg(2, new Int32Array([originImg.width]));
                    kernels[kernelName].setArg(3, new Int32Array([originImg.height]));
                    for(var i = 0; i < args.length; ++i) 
                        kernels[kernelName].setArg(i + 4, args[i]);
                    queue.enqueueNDRangeKernel(kernels[kernelName], globalThreads.length,[], globalThreads, []);
                    queue.finish();
                    queue.enqueueReadBuffer(outputBuffer, true, 0, nBytes, result);
                    var testR = new Float32Array(nBytes);
                    inputBuffer = outputBuffer;
                    outputBuffer = context.createBuffer(cl.MEM_READ_WRITE, nBytes);
                    return this;
            },

            getResult : function () {
                   /* for no cache implmentation, release all */
                   cl.releaseAll();
                   return result;
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
                    console.log(program);
                    program.build(devices, null, null);
                  
                } catch (e) {
                    if (debug) {
                    console.error(e);
                    }
                    throw e;
                }

                return program;
            },

            getInputBuffer : function () {
                return inputBuffer;
            },

            getOutputBuffer : function () {
                return outputBuffer;
            },

            getKernel : function (kernelName) {
                return kernels[kernelName];
            },

            getCommandQueue : function() {
                return queue;
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
