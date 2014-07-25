root_path="../"
combined_path="../combined"
find $root_path -name "kernel.cl" | xargs rm
find $root_path -name "*.cl" | xargs cat > $combined_path/kernel.bak
mv $combined_path/kernel.bak $combined_path/kernel.cl
