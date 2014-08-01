__kernel void embossment(
__global float* input,
const    uint    width,
const    uint    height,
__global float*  backup)
{
    uint ix = get_global_id(0);
    uint iy = get_global_id(1);
    uint i = (iy * width + ix) * 4;

    if (i >= 0 && i < (width * height * 4 - 4)) {
        int row = iy;
        int col = ix;
        int A = ((row - 1) *  width + (col - 1)) * 4;
        int G = (row + 1) * width * 4 + (col + 1) * 4;
        if (row == 0 || col == 0 || row + 1 >= height || col + 1 >= width)
            return;
        input[i+0] = backup[A+0] - backup[G+0] + 127.5;
        input[i+1] = backup[A+1] - backup[G+1] + 127.5;
        input[i+2] = backup[A+2] - backup[G+2] + 127.5;
        //input[i+4] = backup[i+4];
    }
}


