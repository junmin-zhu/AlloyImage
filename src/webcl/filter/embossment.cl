__kernel void embossment(
__global float*  output,
const    uint    width,
const    uint    height,
__global float*  input)
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
        output[i+0] = input[A+0] - input[G+0] + 127.5;
        output[i+1] = input[A+1] - input[G+1] + 127.5;
        output[i+2] = input[A+2] - input[G+2] + 127.5;
        //output[i+4] = input[i+4];
    }
}


