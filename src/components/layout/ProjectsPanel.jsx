export function ProjectsPanel({
  me,
  loading,
  newProjectTitle,
  setNewProjectTitle,
  onCreateProject,
  selectedProjectId,
  setSelectedProjectId,
  projects,
  onLogout,
}) {
  return (
    <aside className="left-panel">
      <div className="panel-head">
        <h2>Projects</h2>
        <button type="button" onClick={onLogout}>Logout</button>
      </div>

      <p className="profile-info">{me?.username || me?.email}</p>

      <form className="inline-form" onSubmit={onCreateProject}>
        <input
          value={newProjectTitle}
          onChange={(e) => setNewProjectTitle(e.target.value)}
          placeholder="New project"
          maxLength={120}
        />
        <button type="submit" disabled={loading}>+
        </button>
      </form>

      <div className="list-wrap">
        <button
          className={selectedProjectId === 'personal' ? 'item active' : 'item'}
          type="button"
          onClick={() => setSelectedProjectId('personal')}
        >
          Personal
        </button>
        {projects.map((project) => (
          <button
            key={project.projectId}
            className={selectedProjectId === project.projectId ? 'item active' : 'item'}
            type="button"
            onClick={() => setSelectedProjectId(project.projectId)}
          >
            {project.title}
          </button>
        ))}
      </div>
    </aside>
  )
}
