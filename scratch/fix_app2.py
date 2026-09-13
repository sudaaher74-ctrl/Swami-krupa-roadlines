import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# The regex in the first script didn't remove the useEffects because of spacing/newline.
# Let's remove them directly using more permissive regex.
content = re.sub(r'  useEffect\(\(\) => \{\n    try \{\n      localStorage\.setItem\(LOCAL_STORAGE_KEY_LR_NOTES.*?\n  \}, \[consignmentNotes\]\);', '', content, flags=re.DOTALL)
content = re.sub(r'  useEffect\(\(\) => \{\n    try \{\n      localStorage\.setItem\(LOCAL_STORAGE_KEY_CUSTOMERS.*?\n  \}, \[customers\]\);', '', content, flags=re.DOTALL)
content = re.sub(r'  useEffect\(\(\) => \{\n    try \{\n      localStorage\.setItem\(LOCAL_STORAGE_KEY_VEHICLES.*?\n  \}, \[vehicles\]\);', '', content, flags=re.DOTALL)
content = re.sub(r'  useEffect\(\(\) => \{\n    try \{\n      localStorage\.setItem\(LOCAL_STORAGE_KEY_TRIP_SLIPS.*?\n  \}, \[tripSlips\]\);', '', content, flags=re.DOTALL)

with open('src/App.tsx', 'w') as f:
    f.write(content)

with open('src/components/Dashboard.tsx', 'r') as f:
    dash_content = f.read()
dash_content = dash_content.replace('Truck, \n  FileText, \n  DollarSign, ', 'FileText, ')
dash_content = dash_content.replace('Truck, ', '')
dash_content = dash_content.replace('DollarSign, ', '')

with open('src/components/Dashboard.tsx', 'w') as f:
    f.write(dash_content)

print("Done")
