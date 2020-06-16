import threading 

def test(arg):
    print(arg)
    pass

threads = []
for i in range(8):
    thread = threading.Thread(target=test, args=(i,))
    threads.append(thread)
    thread.start()

for thread in threads:
    thread.join()