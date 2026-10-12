# K.I.T.T. Skill Registry

This folder contains the Skill Registry for K.I.T.T.: a central catalogue of skills/modules, their metadata and a small loader to suggest which skill should handle a request.

Goals
- Provide a canonical list of skills and capabilities
- Offer a single point to add new skills and map requests to handlers
- Allow the instruct-repair service to pick candidate modules and risk levels

Files
- registry.json — skill definitions
- registry_loader.js — small Node loader + classifier helper
- README.md — documentation for adding skills
- handlers.md — guidance for implementing skill handlers
