# Meta-Prompt: Generate 3 Variants of Travel Planning Application Prompts

## Your Task
You are an expert prompt engineer. Your goal is to create **three different prompt variants** for developing a travel planning web application. Each prompt should guide Claude (or another AI model) to generate complete, production-ready code for the same application, but with different approaches, levels of detail, and target audiences.

Each prompt should be saved as a separate markdown (.md) file with clear naming.

---

## Application Specification

### MVP Core Concept
A single-page web application that collects user travel information through an interactive form, processes it using Claude AI models (Haiku for validation, Sonnet for analysis), and delivers comprehensive travel recommendations.

### User Input Requirements
The form must collect:
1. **Travel Dates**: Departure and return dates
2. **Destination**: City/country location
3. **Accommodation Status**: Whether the user already has accommodation booked
4. **Group Composition**: 
   - Number of adults and children
   - Type of group (Family, Friends, Solo, Couple, Business)
5. **Travel Preferences**: Multiple selections from categories like Nature, Architecture, Entertainment, Food, Adventure, etc.

### AI Processing Pipeline
1. **Claude Haiku** (First Pass):
   - Validate user input
   - Summarize travel profile
   - Extract key parameters
   - Pass refined data to Sonnet

2. **Claude Sonnet** (Second Pass):
   - Analyze comprehensive travel information
   - Generate all output sections
   - Provide detailed, context-aware recommendations

### Required Output Sections

#### 1. Safety & Security Status (Color-Coded)
- **🔴 RED**: High danger zone (war, natural disaster, crisis) - NOT RECOMMENDED
- **🟠 ORANGE**: Moderate risk (political tension, seasonal hazards) - CAUTION ADVISED
- **🟢 GREEN**: Safe conditions - RECOMMENDED

#### 2. Attractions & Points of Interest
List with:
- Name and category
- Price information (FREE, PAID with amount, budget tier)
- Description of why visit
- Tips for visiting

#### 3. Local Cuisine & Dining
Include:
- Top 5-7 traditional/must-try dishes
- Restaurant categories and price ranges
- Dietary considerations (vegetarian, allergens, halal/kosher)
- Local dining customs and etiquette
- Tipping practices

#### 4. Essential Practical Information
Organized reference including:
- Currency and payment methods
- Transportation rules (drive side, license, customs)
- Electrical standards (voltage, plug types)
- Language and communication
- Best/worst seasons and weather
- Emergency contacts
- Visa requirements
- Cultural customs and respectful behavior

### Future Scaling Phases
The application should include a roadmap for:
1. Flight, train, and bus search integration
2. Accommodation booking search
3. Local transportation schedules
4. Itinerary builder with calendar export
5. Additional features (budget calculator, currency converter, etc.)

---

## Your Task: Create Three Prompt Variants

Generate three distinct prompts that will each guide Claude to build the same application, but with different approaches. Save each as a separate markdown file.

### Variant 1: "Detailed & Structured" (travel_prompt_detailed.md)
**Target Audience**: Team leads, product managers, comprehensive documentation needs

**Characteristics**:
- Maximum detail and clarity
- Clear separation of concerns
- All features explicitly listed
- Design patterns and best practices included
- Extensive section descriptions
- Includes rationale for each requirement
- Best for: Teams that need complete specification before coding

**Should Include**: 
- Comprehensive technical stack recommendations
- Detailed component breakdown
- Complete UI/UX specifications
- Design system requirements
- Accessibility considerations
- Performance requirements

---

### Variant 2: "Concise & Practical" (travel_prompt_concise.md)
**Target Audience**: Experienced developers, rapid prototyping, MVPs

**Characteristics**:
- Essential information only
- No redundant explanations
- Direct and actionable instructions
- Assumes developer expertise
- Bullet-point heavy format
- Quick reference material
- Best for: Fast development cycles and experienced teams

**Should Include**:
- Core requirements only (no fluff)
- Key technical decisions
- Essential API integration points
- Critical success criteria
- Minimal but complete examples

---

### Variant 3: "Developer-Focused & Technical" (travel_prompt_technical.md)
**Target Audience**: Senior developers, architects, technical specification

**Characteristics**:
- Code-centric approach
- Specific implementation details
- Architecture diagrams (text-based or ASCII)
- Example code structures/pseudocode
- Data flow specifications
- Error handling scenarios
- Performance benchmarks
- Best for: Technical discussions and architecture planning

**Should Include**:
- Detailed architecture overview
- Data flow diagrams (text-based)
- API interaction specifications
- Database schema (if applicable)
- Code structure examples
- Error handling matrix
- Testing strategy outlines
- Deployment considerations

---

## Output Format Requirements

Each prompt variant should:
1. Be a valid markdown (.md) file
2. Have clear title identifying the variant
3. Contain all necessary information to guide complete application development
4. Include the MVP specification (adjusted for variant's style)
5. Include the future scaling roadmap
6. Be self-contained (readable without external context)
7. Include a "Notes for Developer" section specific to that variant's approach

---

## Quality Criteria

Each prompt should:
- ✅ Be unambiguous and clear
- ✅ Cover all required application features
- ✅ Describe the AI model processing pipeline
- ✅ Detail all output sections and their formatting
- ✅ Provide guidance on technical implementation
- ✅ Include scaling roadmap
- ✅ Be suitable for passing to Claude to generate code
- ✅ Maintain consistency in application requirements across all three variants
- ✅ Have distinct voice and approach matching its target audience

---

## Success Definition

You will have successfully completed this task when:
1. Three distinct prompt variants are created
2. Each variant has a unique approach and style
3. All three describe the same core application
4. Each file is properly formatted as markdown
5. Each includes naming convention: `travel_prompt_[variant_name].md`
6. All three prompts are suitable for passing to Claude API to generate complete application code
7. Clear differences in depth, focus, and presentation between variants are evident

---

## Documentation & Project Management Requirements

### GitHub Repository Documentation

The project must maintain comprehensive documentation on GitHub following these standards:

#### 1. README.md
- Project overview and purpose
- Quick start guide for users
- Installation instructions
- Usage examples
- Current phase/status (MVP, Phase 2, etc.)
- Feature roadmap with estimated timelines
- Link to full documentation
- Contribution guidelines

#### 2. ARCHITECTURE.md
- System architecture overview
- Technology stack details
- AI model integration (Haiku → Sonnet pipeline)
- Data flow diagrams (ASCII/Mermaid format)
- Database schema (if applicable)
- API endpoints specification
- Component structure

#### 3. FEATURES.md
- Complete feature list organized by phase
- Description of each feature
- Status indicators (Planned, In Progress, Completed, On Hold)
- Implementation details
- Known limitations or constraints

#### 4. INSTALLATION.md
- Prerequisites and dependencies
- Step-by-step setup instructions
- Environment variable configuration
- Database setup (if applicable)
- API key configuration
- Local development server startup
- Troubleshooting common issues

#### 5. API_INTEGRATION.md
- Claude API integration guide
- Haiku model usage specifications
- Sonnet model usage specifications
- Prompt templates and examples
- Error handling and retry logic
- Rate limiting considerations
- Cost estimation

#### 6. CONTRIBUTING.md
- Code style guidelines
- Git workflow (branch naming, commit messages)
- Pull request process
- Testing requirements
- Documentation standards
- How to report bugs
- Feature request process

#### 7. CHANGELOG.md
- Version history
- Release notes for each version
- Breaking changes documentation
- Migration guides (when applicable)
- Contributors for each release

#### 8. ROADMAP.md
- 6-12 month development roadmap
- Feature priorities and sequencing
- Phase breakdown (Phase 1 MVP, Phase 2, 3, etc.)
- Estimated timelines and milestones
- Technical debt and optimization priorities
- Team capacity and resource planning

#### 9. DEPLOYMENT.md
- Deployment instructions for different environments
- Production deployment checklist
- Monitoring and logging setup
- Backup and recovery procedures
- Scaling considerations
- Performance optimization tips

#### 10. SECURITY.md
- Security best practices
- API key management
- User data protection measures
- GDPR/Privacy compliance notes
- Vulnerability reporting process

---

## Post-Release Process: Brainstorming & Documentation Update

### Release Cycle Requirements

After each release, the team must follow this structured process:

#### Step 1: Release Documentation (Within 24 hours)
1. Update CHANGELOG.md with:
   - Version number and release date
   - All features released
   - Bug fixes
   - Known issues
   - Migration notes (if breaking changes)
   - Contributors
   - Download/Deploy links

2. Update README.md:
   - Current version number
   - Latest feature highlights
   - Link to detailed CHANGELOG
   - Updated status badges

3. Tag release in GitHub:
   - Create git tag with version number
   - Add release notes
   - Attach binaries/artifacts if applicable

#### Step 2: Post-Release Brainstorming Session (Within 1 week)
Schedule a structured brainstorming meeting with the team:

**Participants**: Developers, product manager, UX designer, stakeholders

**Session Duration**: 60-90 minutes

**Agenda**:

1. **Release Retrospective** (15 min)
   - What went well?
   - What challenges were faced?
   - Lessons learned?
   - Team feedback and morale?

2. **User Feedback Analysis** (15 min)
   - Compile feedback from users (GitHub issues, emails, social media)
   - Identify patterns and trends
   - Highlight feature requests
   - Note pain points and bugs reported

3. **Performance & Metrics Review** (10 min)
   - User adoption rate
   - Feature usage statistics
   - Performance metrics
   - Error rates and uptime
   - User engagement data

4. **Next Steps Brainstorming** (30 min)
   - Prioritize feature requests
   - Identify technical debt to address
   - Discuss optimization opportunities
   - Plan Phase N+1 features
   - Identify blockers or risks

5. **Decision Making** (15 min)
   - Vote on next phase focus areas
   - Assign ownership and responsibilities
   - Set timelines and milestones
   - Define success metrics

**Output**: 
- Meeting notes document
- Prioritized feature list for next phase
- Technical debt assessment
- Updated roadmap

#### Step 3: Documentation Update & Roadmap Refresh (Within 2 weeks)

Update the following documents based on brainstorming outcomes:

**ROADMAP.md Updates**:
- Adjust timelines based on learnings
- Add newly prioritized features
- Reorganize phases if needed
- Update effort estimates
- Reflect team capacity changes

**FEATURES.md Updates**:
- Add new feature entries for planned work
- Update status of completed features
- Move features between phases if priorities shifted
- Add implementation notes from brainstorm

**Architecture Updates**:
- Document any architectural decisions made
- Update ARCHITECTURE.md if new patterns emerged
- Add new integration points if needed

**README.md Updates**:
- Update roadmap section with new priorities
- Highlight most important upcoming features
- Adjust status/phase indicators

**Create New Sprint/Release Planning Document**:
- Detailed breakdown of next phase
- User stories and acceptance criteria
- Technical specifications
- Resource allocation
- Estimated timeline

#### Step 4: Communication & Visibility (Ongoing)

1. **GitHub Discussions/Issues**:
   - Create issues for prioritized features
   - Link to discussion in brainstorming notes
   - Request community input on major decisions

2. **Project Board/Kanban**:
   - Update project boards with new tasks
   - Organize by priority and phase
   - Add effort estimates

3. **Team Communications**:
   - Share brainstorming outcomes with team
   - Celebrate wins from released version
   - Clarify next sprint objectives
   - Identify blockers early

4. **Public Announcements**:
   - Blog post or release announcement
   - Highlight key features and improvements
   - Thank community contributors
   - Preview upcoming features

---

## Documentation Maintenance Schedule

- **After each release**: CHANGELOG, README, version tags (24 hours)
- **Post-brainstorm session**: ROADMAP, FEATURES, sprint planning (2 weeks)
- **Quarterly**: Full documentation review and update
- **Before major phases**: Architecture and API documentation refresh
- **Continuous**: Update CONTRIBUTING.md with new standards/practices

---

## GitHub Issues & Project Management Integration

### Automated Workflow
1. Create GitHub issue for each planned feature
2. Link issues to Discussions for brainstorm findings
3. Use project boards to track progress
4. Close issues and reference in releases
5. Auto-generate changelog from commit messages

### Issue Templates
- Feature Request
- Bug Report
- Documentation Issue
- Discussion (for brainstorming topics)

### Pull Request Requirements
- Link to related issue
- Reference affected documentation
- Update CHANGELOG entry
- Add tests/validation
- Request documentation reviewer

---

## Success Criteria for Documentation & Release Process

✅ All documentation files exist and are current  
✅ README is the single source of truth for project status  
✅ ROADMAP reflects actual priorities and brainstorm outcomes  
✅ Post-release brainstorming happens consistently  
✅ Documentation is updated within 2 weeks of each release  
✅ Community can understand project direction from public docs  
✅ New contributors can onboard using documentation  
✅ GitHub issues align with documented roadmap  
✅ Release notes are clear and detailed  
✅ Architecture documentation reflects actual system design  

---

## Start Now

Create the three prompt variants following this meta-specification. Ensure each is complete, professional, and ready to be used as a standalone instruction for Claude to generate application code.

Additionally, each prompt variant should include guidance on:
- Setting up GitHub repository structure
- Creating initial documentation framework
- Establishing post-release brainstorming process
- Maintaining documentation during development
- Publishing releases with proper versioning