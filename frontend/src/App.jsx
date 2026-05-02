import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import SKUPage from './pages/SKU'
import PurchasePage from './pages/Purchase'
import SalesPage from './pages/Sales'
import ExpensesPage from './pages/Expenses'
import ReportsPage from './pages/Reports'
import FinancePage from './pages/Finance'

function App() {
  return (
    <BrowserRouter>
      <div className="layout">
        <header>
          <h1>AutoParts Inventory</h1>
          <nav>
            <NavLink to="/">Dashboard</NavLink>
            <NavLink to="/sku">SKU</NavLink>
            <NavLink to="/purchase">Purchase</NavLink>
            <NavLink to="/sales">Sales</NavLink>
            <NavLink to="/expenses">Expenses</NavLink>
            <NavLink to="/reports">Reports</NavLink>
            <NavLink to="/finance">Finance</NavLink>
          </nav>
        </header>

        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/sku" element={<SKUPage />} />
            <Route path="/purchase" element={<PurchasePage />} />
            <Route path="/sales" element={<SalesPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/finance" element={<FinancePage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
