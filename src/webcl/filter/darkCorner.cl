/*float f(float x, float p0, float p1, float p2, float p3) {
   return p0 * pow((1 - x), 3) + 3 * p1 * x * pow((1 - x), 2) + 3 * p2 * x * x * (1 - x) + p3 * pow(x, 3);
}*/


__kernel void darkCorner(
            __global float* input,
            const    int    width,
            const    int    height,
            const    int     r,
            const    int     lastlevel)
{
    uint ix = get_global_id(0);
    uint iy = get_global_id(1);
    uint reali = iy * width + ix;
    float4 temp = (float4)(input[reali * 4], input[reali * 4 + 1], input[reali * 4 + 2], input[reali * 4 + 3]); 
    float2 middlePoint = (float2)(width * 2 / 3.0, height / 2.0);
    float2 currPoint = (float2)(ix, iy);

    float maxdistance = length(middlePoint);
    float startdistance = maxdistance * (1 - r / 10.0);
    float dis = distance(currPoint, middlePoint);

    float currbilv = (dis - startdistance) / (maxdistance - startdistance);
    if (currbilv < 0) return;

    /* according to js version f(currBilv, 0 , 0.02, 0.3, 1)*/
    float bilv = 3 * 0.02 * currbilv * (1 - currbilv) * (1 - currbilv);
                 + 3 * 0.3 * currbilv * currbilv * (1 - currbilv) 
                 + currbilv * currbilv * currbilv;
    temp -= bilv * lastlevel * temp / 255;
    input[reali * 4] = temp.x;
    input[reali * 4 + 1] = temp.y;
    input[reali * 4 + 2] = temp.z;
}
