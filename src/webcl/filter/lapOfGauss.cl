__kernel void borderline(
            __global float* output,
            const    int    width,
            const    int    height,
            __global float* input)
{
    uint ix = get_global_id(0);
    uint iy = get_global_id(1);
    uint realI = (iy * width + ix) * 4; 

    if (ix == 0 || iy == 0)
        return;

    if (realI > (width*height - 1)*4)
        return;

    int template[9] = { 0, 1, 0, 1, -4, 1, 0, 1, 0 };
    int start = -1;
    int pixelArr[3*9];
    uint index[3] = {0, 0, 0};
    for(int k = start;k <= -start;k ++){
        int currRow = ix + k;
        for(int kk = start;kk <= -start;kk ++){
            int currCol = iy + kk;
            int currI = (currRow * width + currCol) * 4;
            for(int j = 0;j < 3;j ++){
                int tempI = currI + j;
                if (tempI < width*height*4)
                    pixelArr[j*9 + index[j]] = input[currI + j];
                else
                    pixelArr[j*9 + index[j]] = 0;
                index[j] = index[j] + 1;
            }
        }
    }           
   
    for (int j = 0; j < 3; j++) {
        for (int i = 0; i < 9; i ++) {
            output[realI + j] +=  pixelArr[j*9 + i] * template[i];
        }
    }
    if (realI+4 < width*height*4)   
        output[realI + 4] = input[realI + 4];
}

