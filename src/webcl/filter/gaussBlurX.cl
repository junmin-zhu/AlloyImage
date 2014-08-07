__kernel void gaussBlurX(
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
    float r = 0; float g = 0; float b = 0; float a = 0;
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
    io[i] = r / gaussSum;
    io[i + 1] = g / gaussSum;
    io[i + 2] = b / gaussSum;
}
