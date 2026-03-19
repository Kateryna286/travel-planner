# Synthesis Prompt: Create an Optimal Hybrid Travel App Prompt

## Your Task

You have access to three variants of a travel planning application prompt:
1. **Detailed & Structured** - Comprehensive planning-focused variant
2. **Concise & Practical** - Action-oriented developer variant  
3. **Developer-Focused & Technical** - Architecture and code-focused variant

You have analyzed all three and identified their respective strengths and weaknesses.

**Your new objective:** Create a **single, unified, optimized hybrid prompt** that combines the best elements of all three variants into one superior document.

---

## Synthesis Requirements

### Core Strategy
Build the hybrid prompt using this structure:

**Primary Foundation:** Developer-Focused & Technical
- Keep its typed interfaces and Zod schemas
- Maintain its code artifacts and API skeleton
- Preserve its architectural rigor
- **FIX the placeholder issue**: Embed the complete TravelReport interface directly in the Sonnet prompt template (no [paste...] placeholders)

**Add from Detailed & Structured:**
- Complete UX/Design section with visual hierarchy guidelines
- Full documentation list (10 GitHub files with descriptions)
- Post-release brainstorming process (all 4 steps)
- Accessibility considerations beyond just ARIA

**Add from Concise & Practical:**
- Field table format for form input specification (faster scanning than prose)
- Essential information only (remove redundancy)
- Bullet-point heavy sections for quick reference
- Success criteria checklist

**Critical Addition:** Fix the temperature settings gap
- Explicitly specify: `temperature: 0` for Haiku (deterministic validation)
- Explicitly specify: `temperature: 0.7` for Sonnet (creative recommendations)
- Explain why these settings matter

**New Addition:** Accessibility for AI-powered flows
- ARIA live regions for loading state announcer
- Screen reader considerations for color-coded safety status
- Keyboard navigation for form inputs
- Loading indicator best practices

---

## Hybrid Prompt Structure

The final hybrid prompt should be organized as follows:

```
1. Executive Overview
   - Quick project summary
   - Use this document when you need to [X]
   
2. Architecture & Technical Foundation
   - System architecture diagram (ASCII/Mermaid)
   - Technology stack with justifications
   - AI model pipeline (Haiku → Sonnet)
   - Data flow diagram
   - Typed interfaces (with TravelReport fully defined)
   - Zod validation schemas
   - API skeleton code snippets
   
3. MVP Features - Implementation Details
   - 3.1 Form Input Specification (field table format)
   - 3.2 AI Processing Pipeline (with code examples)
   - 3.3 Output Generation (all 4 sections with examples)
   - 3.4 Component Structure
   
4. Output Sections - Complete Specification
   - Safety & Security Assessment (with color accessibility notes)
   - Attractions & Points of Interest
   - Local Cuisine & Dining
   - Essential Practical Information
   (Each with data structure examples and rendering guidelines)
   
5. Design & User Experience
   - Visual design principles
   - Color scheme with accessibility compliance
   - Information hierarchy
   - Loading states and animations
   - Mobile responsiveness
   - Error states and handling
   
6. Technical Implementation
   - Frontend framework requirements
   - API integration specifics
   - Component breakdown
   - State management
   - Error handling matrix
   - Performance benchmarks
   - Testing strategy
   
7. GitHub Documentation & Project Management
   - 10 required documentation files with templates
   - File purposes and maintenance schedule
   - Issue templates
   - PR requirements
   
8. Post-Release Process
   - Step 1: Release Documentation (24 hours)
   - Step 2: Brainstorming Session (1 week)
   - Step 3: Documentation Update (2 weeks)
   - Step 4: Communication & Visibility
   - Documentation maintenance schedule
   
9. Future Scaling Roadmap
   - Phase 2: Transportation Search
   - Phase 3: Accommodation Booking
   - Phase 4: Local Transportation
   - Phase 5: Itinerary & Calendar
   - Phase 6+: Additional Features
   - Implementation priorities and sequencing
   
10. Success Criteria & Metrics
    - MVP success criteria checklist
    - Phase completion metrics
    - User satisfaction metrics
    - Performance targets
    
11. Critical Implementation Notes
    - Temperature settings (Haiku: 0, Sonnet: 0.7)
    - Placeholder resolution (TravelReport must be fully embedded)
    - Accessibility requirements (ARIA live regions, etc.)
    - Common pitfalls to avoid
    - When to deviate from this specification
    
12. Quick Reference Tables
    - Form fields summary table
    - API endpoints reference
    - Color coding meanings (safety status)
    - Phase deliverables checklist
    - Team role assignments
```

---

## Quality Requirements for the Hybrid

The hybrid prompt must:

✅ Be complete and self-contained (no external references needed)  
✅ Eliminate all redundancy and duplication  
✅ Fix all identified issues (placeholder, temperature settings, accessibility)  
✅ Maintain the technical rigor of the Technical variant  
✅ Include the UX clarity of the Detailed variant  
✅ Provide the quick-reference utility of the Concise variant  
✅ Be suitable for passing directly to Claude to generate complete application code  
✅ Be suitable for stakeholder alignment and planning meetings  
✅ Be suitable as a working reference during development  
✅ Include code examples where they improve clarity  
✅ Be approximately 8,000-12,000 words (substantial but not overwhelming)  

---

## Critical Fixes Required

### 1. TravelReport Interface Placeholder
**Current Problem in Technical:** `[paste TravelReport interface here]`

**Solution:** Embed the complete, fully-defined interface in the prompt. For example:
```typescript
interface TravelReport {
  safety: SafetyStatus;
  attractions: Attraction[];
  cuisine: CuisineGuide;
  practicalInfo: PracticalInfo;
}

interface SafetyStatus {
  level: 'RED' | 'ORANGE' | 'GREEN';
  statusBadge: string;
  explanation: string;
  keyRisks: string[];
  precautions: string[];
}
// [... full definitions for all interfaces ...]
```

### 2. Temperature Settings Gap
**Current Problem in Concise:** No temperature specifications mentioned

**Solution:** Add explicit section:
```
API Configuration for Deterministic Results:

Haiku Model Call:
- model: "claude-3-5-haiku-20241022"
- temperature: 0 (deterministic validation)
- max_tokens: 1000

Sonnet Model Call:
- model: "claude-opus-4-20250805"
- temperature: 0.7 (creative recommendations)
- max_tokens: 3000

Why these settings:
- temperature: 0 ensures Haiku validation is consistent (same input = same output)
- temperature: 0.7 allows Sonnet to generate varied, personalized recommendations
```

### 3. Accessibility Gap
**Current Problem:** Minimal accessibility guidance in Technical

**Solution:** Add section on AI-specific accessibility:
```
Accessibility for AI-Powered Loading States:

ARIA Live Region for Status Updates:
- Use aria-live="polite" container for loading messages
- Announce: "Validating your travel information..."
- Then: "Generating personalized recommendations..."
- Finally: "Your travel guide is ready"

Color-Coded Safety Status:
- Never rely on color alone
- Always include: emoji (🔴🟠🟢), text label (RED/ORANGE/GREEN), written status
- Example: "🔴 RED - High Risk: This destination currently has [specific issue]"

Screen Reader Considerations:
- Form fields need proper labels and error announcements
- Results sections should have clear heading hierarchy (h2, h3)
- Use aria-describedby for detailed explanations
```

---

## Integration Points

### From Detailed & Structured - Take:
- Full 10-item GitHub documentation list (README, ARCHITECTURE, FEATURES, etc.)
- Complete post-release brainstorming process (all 4 steps with timing)
- Comprehensive design system requirements
- Accessibility considerations section
- Team collaboration guidelines

### From Concise & Practical - Take:
- Field input specification as a table (not prose)
- Bullet-point format for lists
- "Essential information only" philosophy
- Quick success criteria checklist
- Removed jargon and simplified language

### From Developer-Focused & Technical - Keep:
- Typed interfaces and data structures
- Code examples and pseudocode
- Detailed architecture diagrams
- API specifications
- Implementation details
- Error handling matrix

---

## Validation Checklist

Before finalizing the hybrid prompt, verify:

- [ ] All three variants' content is represented (not all original content, but core ideas)
- [ ] No contradictions between sections
- [ ] TravelReport interface is fully defined (no placeholders)
- [ ] Temperature settings are explicitly specified
- [ ] Accessibility requirements are included
- [ ] All code examples are syntactically correct
- [ ] All diagrams are clear (ASCII or Mermaid)
- [ ] Document is scannable with clear headings
- [ ] All 4 output sections are fully specified with examples
- [ ] Future phases are clearly sequenced
- [ ] GitHub documentation list is complete
- [ ] Post-release process is step-by-step
- [ ] Success criteria are measurable and realistic

---

## Final Output Format

The hybrid prompt should be:
- A single, comprehensive markdown (.md) file
- Named: `travel_prompt_hybrid_optimized.md`
- Ready to pass directly to Claude API to generate complete application
- Suitable as a reference document throughout development
- Professional enough for stakeholder presentations
- Technical enough for architects and senior developers
- Clear enough for junior developers and new team members

---

## Success Definition

You will have successfully created the optimal hybrid prompt when:

1. ✅ It combines the best of all three variants
2. ✅ All identified issues are fixed
3. ✅ It's more useful than any single original variant
4. ✅ It eliminates redundancy and duplication
5. ✅ It can stand alone without needing to reference other documents
6. ✅ It provides both strategic (roadmap, design) and tactical (code, config) guidance
7. ✅ It's suitable for all stakeholders (PM, developers, architects, designers)
8. ✅ A developer could generate a complete application from just this prompt
9. ✅ The document is well-organized and easy to navigate
10. ✅ All critical implementation details are explicit and unambiguous

---

## Start Now

Create the optimal hybrid travel app prompt that combines the strengths of all three variants while fixing their identified weaknesses. Produce a single, comprehensive, production-ready prompt document that is superior to any of the original three variants.