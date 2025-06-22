const SkillsDisplay = ({ skills, title }) => {
  if (!skills || skills.length === 0) return null

  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, index) => (
          <span 
            key={index} 
            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  )
}

export default SkillsDisplay