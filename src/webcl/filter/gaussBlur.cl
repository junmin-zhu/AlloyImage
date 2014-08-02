__kernel void gaussBlur(
    __global float* io,
    const    int    width,
    const    int    height,
    const    int    radius,
    const    float  sigma,
    __global  float* gaussMatrix,
    __global float* backup)
{
    int ix = get_global_id(0);
    int iy = get_global_id(1);
    int i = (iy * width + ix) * 4;
    int ii;
    int k;
    float gaussSum = 0;
    int r = 0; int g = 0; int b = 0; int a = 0;
    for(int j = -radius; j <= radius; j++) {
        k = ix + j;
        if (k >= 0 && k < width) {
            ii = (iy * width + k) * 4;
            r += backup[ii] * gaussMatrix[j + radius];
            g += backup[ii + 1] * gaussMatrix[j + radius];
            b += backup[ii + 2] * gaussMatrix[j + radius];
            gaussSum += gaussMatrix[j + radius];
        }
    }
    backup[i] = r / gaussSum;
    backup[i + 1] = g / gaussSum;
    backup[i + 2] = b / gaussSum;

    for(int j = -radius; j <= radius; j++) {
        k = iy + j;
        if(k >= 0 && k < height) {
          ii = (k * width + ix) * 4;
          r += backup[ii] * gaussMatrix[j + radius];
          g += backup[ii + 1] * gaussMatrix[j + radius];
          b += backup[ii + 2] * gaussMatrix[j + radius];
          gaussSum += gaussMatrix[j + radius];
        }

    }
    io[i] = r / gaussSum;
    io[i + 1] = g / gaussSum;
    io[i + 2] = b / gaussSum;

}
