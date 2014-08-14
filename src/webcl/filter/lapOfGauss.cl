__kernel void borderline(
            __global float* io,
            const    int    width,
            const    int    height,
            const    int    start,
            __global int*   template,
            __global float* backup)
{
    int ix = get_global_id(0);
    int iy = get_global_id(1);
    int realI = (iy * width + ix) * 4; 

    if (ix == 0 || iy == 0 || ix == width-1 || iy == height-1) {
        // take 256 as undefined in the JavaScript.
        io[realI + 0] = 256;
        io[realI + 1] = 256;
        io[realI + 2] = 256;
        io[realI + 3] = 256;
        return;
    }

    if (ix >= width || iy >= height)
        return;

    // 3 means R,G,B; 9 means (2*start+1)*(2*start+1)
    float pixelArr[3*9] = {0};
    for(int k = start;k <= -start;k ++){
        int currRow = iy + k;
        for(int kk = start;kk <= -start;kk ++){
            int currCol = ix + kk;
            int currI = (currRow * width + currCol) * 4;
            for(int j = 0;j < 3;j ++){
                int tempI = currI + j;
                if (tempI <= (width*height - 1)*4) {
                    int index = (k - start) * (2 * (-start) + 1) + (kk - start);
                    pixelArr[j*9 + index] = backup[tempI];
                }
            }
        }
    }           
   
    for (int j = 0; j < 3; j++) {
        io[realI + j] = 0;
        for (int i = 0; i < 9; i ++) {
            io[realI + j] +=  pixelArr[j*9 + i] * template[i];
        }
    }
    io[realI + 3] = 256;
}

