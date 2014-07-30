float f(float x, float p0, float p1, float p2, float p3) {
   return p0 * pow((1 - x), 3) + 3 * p1 * x * pow((1 - x), 2) + 3 * p2 * x * x * (1 - x) + p3 * pow(x, 3);
}

float calDark(int x, int y, float middlex, float middley, int p, int lastlevel, float startdistance, float maxdistance) {
   float distance = hypot(x - middlex, y - middley);
   float currbilv= (distance - startdistance) / (maxdistance - startdistance);
   if (currbilv < 0) currbilv = 0;
   return f(currbilv, 0, 0.02, 0.3, 1) * p * lastlevel / 255; 
}

__kernel void darkCorner(
            __global float* input,
            const    int    width,
            const    int    height,
            const    int     r,
            const    int     lastlevel)
{
    int ix = get_global_id(0);
    int iy = get_global_id(1);
    
    float xlength = r * 2 + 1;
    
    float middlex = width * 2 / 3.0;
    float middley = height * 1 / 2.0;

    float maxdistance = hypot(middlex, middley);
    float startdistance = maxdistance * (1 - r / 10.0);

    int reali = iy * width + ix;
    for (int j = 0; j < 3; j ++) {
         float ddarkness = calDark(ix, iy, middlex, middley, input[reali * 4 + j], lastlevel, startdistance, maxdistance);
         input[reali * 4 + j] -= ddarkness;
    }
}
