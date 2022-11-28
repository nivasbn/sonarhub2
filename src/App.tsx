import './App.css';
import Areachart from "./AreaChart/index"
import weekSampleData from "./AreaChart/sampleData/week.json"
import defaultConfig from "./AreaChart/sampleData/config.json"
function App() {
  return (
    <div className="App">
      <h1>basic testds</h1>
      <Areachart data={weekSampleData} config={defaultConfig} />
    </div>
  );
}

export default App;
