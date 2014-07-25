float f(int x, int p0, int p1, int p2, int p3) {
   return p0 * pow((1 - x), 3) + 3 * p1 * x * pow((1 - x), 2) + 3 * p2 * x * x * (1 - x) + p3 * pow(x, 3);
}

float calDark(int x, int y, int middlex, int middley, int p, int lastlevel, float startdistance, float maxdistance) {
   float distance = hypot(x - middlex, y - middley);
   float currbilv= (distance - startdistance) / (maxdistance - startdistance);
   if (currbilv < 0) currbilv = 0;
   return f(currbilv, 0, 0.02, 0.3, 1) * p * lastlevel / 255; 
}

__kernel void darkCorner(
            __global float* input,
            __global float* output,
            const    int    width,
            const    int    height,
            const    int     r,
            const    int     lastlevel)
{
    int ix = get_global_id(0);
    int iy = get_global_id(1);
    
    int xlength = r * 2 + 1;
    
    int middlex = width * 2 / 3;
    int middley = height * 1 / 2;

    float maxdistance = hypot(middlex, middley);
    float startdistance = maxdistance * (1 - r / 10);

    int reali = iy * width + ix;
    for (int j = 0; j < 3; j ++) {
         float ddarkness = calDark(ix, iy, middlex, middley, input[reali * 4 + j], lastlevel, stardistance, maxdistance);
         output[reali * 4 + j] -= ddarkness;
    }
}
