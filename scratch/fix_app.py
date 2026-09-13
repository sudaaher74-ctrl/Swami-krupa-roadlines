import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# 1. Add Dashboard import
content = content.replace(
    "import { SavedConsignmentNotesModal } from './components/SavedConsignmentNotesModal';",
    "import { SavedConsignmentNotesModal } from './components/SavedConsignmentNotesModal';\nimport { Dashboard } from './components/Dashboard';"
)

# 2. Add useStore import
content = content.replace(
    "import './styles/app.css';",
    "import './styles/app.css';\nimport { useStore } from './store/useStore';"
)

# 3. Remove default imports
content = content.replace(
    "  defaultCompanyProfile,\n",
    ""
)

# 4. Remove unused fetch* and store constants
content = re.sub(r'fetchInvoices, ', '', content)
content = re.sub(r'fetchConsignmentNotes, ', '', content)
content = re.sub(r'fetchCustomers, ', '', content)
content = re.sub(r'fetchVehicles, ', '', content)
content = re.sub(r'fetchTripSlips, ', '', content)
content = re.sub(r"const LOCAL_STORAGE_KEY_CUSTOMERS.*?\n", "", content)
content = re.sub(r"const LOCAL_STORAGE_KEY_VEHICLES.*?\n", "", content)
content = re.sub(r"const LOCAL_STORAGE_KEY_TRIP_SLIPS.*?\n", "", content)

# 5. Remove default lists
content = re.sub(r"const defaultTripSlipsList: TripSlip\[\].*?];\n+", "", content, flags=re.DOTALL)
content = re.sub(r"const defaultCustomersList: CustomerRecord\[\].*?];\n+", "", content, flags=re.DOTALL)
content = re.sub(r"const defaultVehiclesList: VehicleRecord\[\].*?];\n+", "", content, flags=re.DOTALL)

# 6. Change activeDocType default
content = content.replace(
    "const [activeDocType, setActiveDocType] = useState<'invoice' | 'lr'>('invoice');",
    "const [activeDocType, setActiveDocType] = useState<'dashboard' | 'invoice' | 'lr'>('dashboard');"
)

# 7. Replace useState declarations with useStore
state_block = r"  // Saved Invoices list.*?// UI modals & view states"
store_block = """  const {
    savedInvoices, setSavedInvoices,
    consignmentNotes, setConsignmentNotes,
    customers, setCustomers,
    vehicles, setVehicles,
    tripSlips, setTripSlips,
    fetchInitialData, resetToDemo
  } = useStore();

  // UI modals & view states"""
content = re.sub(state_block, store_block, content, flags=re.DOTALL)

# 8. Remove localstorage sync
sync_block = r"  // Sync state to localStorage.*?// Supabase Initial Fetch"
content = re.sub(sync_block, "// Supabase Initial Fetch", content, flags=re.DOTALL)
sync_block2 = r"  useEffect\(\(\) => {\n    try {\n      localStorage.setItem\(LOCAL_STORAGE_KEY_LR_NOTES.*?LOCAL_STORAGE_KEY_TRIP_SLIPS.*?},\n  }, \[tripSlips\]\);"
content = re.sub(sync_block2, "", content, flags=re.DOTALL)

# 9. Update initial fetch
old_fetch = r"const initData = async \(\) => {.*?    };"
new_fetch = """const initData = async () => {
      const { invs } = await fetchInitialData();
      if (invs.length > 0) {
          setCurrentInvoice(prev => {
            if (!invs.find(i => i.id === prev.id) && prev.id.startsWith('inv-')) {
                return { ...prev, billNo: calculateNextBillNumber(invs) };
            }
            return prev;
          });
      }
    };"""
content = re.sub(old_fetch, new_fetch, content, flags=re.DOTALL)
content = content.replace("initData();\n  }, []);", "initData();\n  }, [fetchInitialData]);")

# 10. Update handleResetToDemo
old_reset = r"const handleResetToDemo = \(\) => {.*?showToast\('Reset to default demo data!'\);\n  };"
new_reset = """const handleResetToDemo = () => {
    if (window.confirm('Are you sure you want to completely reset? This cannot be undone.')) {
      resetToDemo();
      setCurrentInvoice(defaultInvoice);
      setCurrentConsignmentNote(defaultConsignmentNote);
      showToast('Reset to default demo data!');
    }
  };"""
content = re.sub(old_reset, new_reset, content, flags=re.DOTALL)

# 11. Wrap main-content-area
main_area = r"      <main className=\"app-main-workspace\">\n(.*?)      </main>"
def replacer(match):
    inner = match.group(1)
    # indent inner
    indented = "\n".join("        " + line if line.strip() else line for line in inner.split("\n"))
    return f"""      <main className="app-main-workspace">
        {{activeDocType === 'dashboard' ? (
          <Dashboard />
        ) : (
          <>
{indented}
          </>
        )}}
      </main>"""
content = re.sub(main_area, replacer, content, flags=re.DOTALL)

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("Done")
