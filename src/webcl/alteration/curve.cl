float getLk(float x, int k, __global float* xArr, int num)
{
    float omigaXk = 1;
    float omigaX = 1;
    for(int i = 0; i < num; i++) {
        if (i != k) {
            omigaXk *= xArr[k] - xArr[i];
            omigaX *= x - xArr[i];
        }
    }
    float lk = omigaX / omigaXk;
    return lk;
}

float lagrange(__global float* xArr, __global float* yArr, float x, int num)
{
    float L = 0;
    for (int k = 0; k < num; k++) {
        float lk = getLk(x, k, xArr, num);
        L += yArr[k] * lk;
    }
    return L;
}


__kernel void curve (
    __global  float* input,
    const     int    width,
    const     int    height,
    __global  float* arg0,
    __global  float* arg1,
    __global  int*   indexOfArr,
    const     int    num)
{
    int ix = get_global_id(0);
    int iy = get_global_id(1);
    int realI = iy * width + ix;
    
    
    for(int j = 0; j < 3; j++) {
        if (indexOfArr[j] == 0) continue;
        input[realI * 4 + j] = lagrange(arg0, arg1, input[realI * 4 + j], num);
    }

}
