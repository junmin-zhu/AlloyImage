__kernel void embossment(
__global float* input,
__global float* output,
const    uint    width,
const    uint    height,
const    uint    length)
{
    uint i = get_global_id(0);

    if (i >= 0 && i < (length - 1) && i%4 == 0) {
        int ii = i / 4;
        int row = ii / width;
        int col = ii % width;
        int A = ((row - 1) *  width + (col - 1)) * 4;
        int G = (row + 1) * width * 4 + (col + 1) * 4;
        if (row == 0 || col == 0)
            return;
        output[i+0] = input[A+0] - input[G+0] + 127.5;
        output[i+1] = input[A+1] - input[G+1] + 127.5;
        output[i+2] = input[A+2] - input[G+2] + 127.5;
        output[i+4] = input[i+4];
    }
}
