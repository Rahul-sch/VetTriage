import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { HomePage } from "./pages/HomePage";
import { OwnerIntakePage } from "./pages/OwnerIntakePage";
import { OwnerSummaryPage } from "./pages/OwnerSummaryPage";

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/owner/:visitToken" element={<OwnerIntakePage />} />
          <Route path="/owner/:visitToken/summary" element={<OwnerSummaryPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
