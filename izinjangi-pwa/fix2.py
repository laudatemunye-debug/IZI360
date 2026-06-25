with open('src/screens/AllScreens.jsx', 'r') as f:
    c = f.read()

c = c.replace(
    '<div style={{backgroundColor:C.g,padding:\'14px 16px 20px\'}}>',
    '<div style={{backgroundColor:C.g,padding:\'calc(env(safe-area-inset-top) + 14px) 16px 20px\'}}>'
)

with open('src/screens/AllScreens.jsx', 'w') as f:
    f.write(c)

print("✅ OK")
