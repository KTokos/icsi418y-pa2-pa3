import Signup from './components/Signup'
import Login from './components/Login'
import './App.css'
import CreateProject from './components/CreateProject'
import ProjectList from './components/ProjectList'
import ManageMembers from './components/ManageMembers'

function App() {
  return (
    <div className="main-layout">
      <Signup />
      <Login />
      <CreateProject />
      <ProjectList />
      <ManageMembers />
    </div>
  )
}

export default App
