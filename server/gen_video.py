'''
Apache header:

  Copyright 2020 Google LLC

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
'''

import sys
import os
import random
import numpy as np
import cv2
from subprocess import call, PIPE

dir_path = os.path.dirname(os.path.realpath(__file__))
if "test_videos" not in dir_path:
	dir_path = os.path.join(dir_path, "test_videos/")

print(f"create directory {dir_path}")
call(f"mkdir {dir_path}".split())

print(f"create a random image 100x100")
dim = 100
img = np.zeros((dim, dim, 3), np.uint8)
for x in range(dim):
    for y in range(dim):
        img[x, y] = [
            random.randint(0, 255),
            random.randint(0, 255),
            random.randint(0, 255)
        ]

print(f"save the image in {dir_path}{sys.argv[1]}.png")
cv2.imwrite(f"{dir_path}{sys.argv[1]}.png", img)
print(f"create a video of that image with ffmpeg in {dir_path}{sys.argv[1]}.mp4")
os.system(
    f"ffmpeg -r 1 -i {dir_path}{sys.argv[1]}.png -vcodec mpeg4 -y {dir_path}{sys.argv[1]}.mp4"
)
