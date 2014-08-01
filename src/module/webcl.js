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
        var initialized = false;
        var NO_WebCL_FOUND = "Unfortunately your system does not support WebCL";
        var NO_PLATFORM_FOUND = "No WebCL platform found in your system";
        var NO_DEVICE_FOUND = "No WebCL device found in your system";
        var EXTENSION_NOT_SUPPORTED = "Extension is not supported";
        var INVALID_SEQUENCE = "Context is null, you must create a context " +
                "before call createWebCLProgram";

        /* Global vars */
        var platforms , devices = [] , context = null, program = null, queue = null;
        /* Global memory objects */
        /*var inputBuffer = null, outputBuffer = null;*/
        /* Global kernels as mapped type */
        //var kernels = {"darkCorner": null};
        /* Global work size */
        var globalThreads = null;

        /* result and image info*/
        var result, originImg, width, height, nRGBA, nBytes;

        var cl;
        if (typeof(webcl) != "undefined") {
            cl = webcl;
        } else if (typeof(WebCL) != "undefined") {
            cl = new WebCL();
        }

        var scripts = document.getElementsByTagName( 'script' );
        var clPath = scripts[scripts.length - 1].src.replace('alloyimage.js', 'kernel.cl');

        /**
         * Load the kernel file and return its content
         *
         * @param {String} filePath - Kernel file (*.cl) path
         * @returns {String} File content
         */
        var loadKernel = function (filePath) {
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
        };

        var CLExecutor = function(){
            var context, commandQueue, program = null, 
                kernels = {"darkCorner": null,
                           "curve": null,
                           "embossment": null};
            var ioBuffer, result, globalThreads;
            var buffers = [];
            var executor = {
                init : function(device, src) {
                   //try {
                   context = cl.createContext(device);
                   commandQueue = context.createCommandQueue(device, null);
                   program =  context.createProgram(src);
                   program.build(device, null, null);
                   for (kernelName in kernels) {
                       kernels[kernelName] = program.createKernel(kernelName);
                   }
                   //} catch(e) {
                    //   console.log(e);
                    //   var text = program.getBuildInfo(device,cl.PROGRAM_BUILD_LOG);
                    //   console.log(text);
                   //}
                    return this;
                },

                initBuffer : function() {
                    ioBuffer = context.createBuffer(cl.MEM_READ_WRITE, nBytes,
                                                                 new Float32Array(originImg.data));
                    globalThreads = [width, height];
                    result = new Float32Array(nBytes);
                    return this;
                },

                run : function(kernelName, args) {
                    //try{
                    kernels[kernelName].setArg(0, ioBuffer);
                    kernels[kernelName].setArg(1, new Int32Array([width]));
                    kernels[kernelName].setArg(2, new Int32Array([height]));
                    for (var i = 0; i < args.length; ++i){
                        kernels[kernelName].setArg(i + 3, args[i]);
                    }
                    commandQueue.enqueueNDRangeKernel(kernels[kernelName], globalThreads.length,[], globalThreads, []);
                    commandQueue.finish();
                    commandQueue.enqueueReadBuffer(ioBuffer, true, 0 , nBytes, result);
                    //} catch(e) {
                    //    console.log(e);
                        
                    //    console.log(args.length);
                    //}
                    return this;
                },

                convertArrayToBuffer: function(arr, type) {
                    switch(type) {
                        case "float":
                            var bytes = Float32Array.BYTES_PER_ELEMENT * arr.length;
                            buffers[buffers.length] = 
                                context.createBuffer(cl.MEM_READ_WRITE, bytes,
                                                     new Float32Array(arr));
                            break;
                        case "int":
                            var bytes = Int32Array.BYTES_PER_ELEMENT * arr.length;
                            buffers[buffers.length] =
                                context.createBuffer(cl.MEM_READ_WRITE, bytes,
                                                     new Int32Array(arr));
                            break;
                    }
                    return buffers[buffers.length -1];
                },

                getResult : function() {
                    ioBuffer.release();
                    for (var i = 0; i < buffers.length; i ++)
                        buffers[i].release();
                    buffers = [];
                    return result;
                }
            };
            return executor;
        };

        var CLExecutorCPU = null, CLExecutorGPU = null;
        var Executor = null;

        var initCL = function() {
            /**
             * Check if WebCL is available and populate
             * platforms and devices. Type can be Default, CPU or GPU.
             *
             */
            if (cl === undefined) {
                throw new Error(NO_WebCL_FOUND);
            }
            platforms = cl.getPlatforms();

            devices["cpu"]= platforms[0].getDevices(cl.DEVICE_TYPE_CPU);
            devices["gpu"] = platforms[0].getDevices(cl.DEVICE_TYPE_GPU);
            var src = loadKernel(clPath);
            if (devices["cpu"].length) {
                CLExecutorCPU = new CLExecutor().init(devices["cpu"][0], src);
            } else
                CLExecutorCPU = null;
            if (devices["gpu"].length) {
                CLExecutorGPU = new CLExecutor().init(devices["gpu"][0], src);
            }
            else
                CLExecutorGPU = null;
        };

        var updateImgInfo = function(imgData) {
            /* Create Buffer of WebCL need bytes in size, and cannot get throug
             * js api but this transfer imgData which from context.getImageData
             * API call and the format of pixel is RGBA and each element stand for
             * values of R or G or B or A, so each element is 8 bytes
             */
            nRGBA = imgData.width * imgData.height * 4;
            nBytes = nRGBA * Float32Array.BYTES_PER_ELEMENT;
            width = imgData.width;
            height = imgData.height;
            originImg = imgData;
        };

        /* API */
        var WebCLCommon = {

            init : function (type) {
                if (!initialized) {
                    initCL();
                    initialized = true;
                }
                switch (type) {
                    case "CPU":
                    case "DEFAULT":
                    case "ALL":
                        if (CLExecutorCPU != null)
                            Executor = CLExecutorCPU;
                        else
                            Executor = null;
                        break;
                    case "GPU":
                        if (CLExecutorGPU != null)
                            Executor = CLExecutorGPU;
                        else
                            Executor = null;
                        break;
                }
                if (Executor == null) {
                    console.log(type + "do not support CL on the device");
                    throw new Error(NO_DEVICE_FOUND);
                }
            },

            loadData : function (imgData) {
                updateImgInfo(imgData);
                Executor.initBuffer();
            },

            run :  function (kernelName, args) {
                Executor.run(kernelName,args);
                return this;
            },

            getResult : function () {
                return Executor.getResult();
            },

            convertArrayToBuffer: function(arr, type) {
                return Executor.convertArrayToBuffer(arr, type);
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
                    var text = program.getBuildInfo(devices[0], cl.PROGRAM_BUILD_LOG);
                    console.log(text);
                    console.error(e);
                    }
                    throw e;
                }

                return program;
            },
            /*
            getInputBuffer : function () {
                return inputBuffer;
            },

            getOutputBuffer : function () {
                return outputBuffer;
            },
            */
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
