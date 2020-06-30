import sys
import os
import random
import numpy as np
import cv2

dim = 100
img = np.zeros((dim,dim,3),np.uint8)
for x in range(dim):
    for y in range(dim):
        img[x,y] = [random.randint(0,255),random.randint(0,255),random.randint(0,255)]

cv2.imwrite(f"./test_videos/{sys.argv[1]}.png",img)
os.system(f"ffmpeg -r 1 -i ./test_videos/{sys.argv[1]}.png -vcodec mpeg4 -y ./test_videos/{sys.argv[1]}.mp4")