# 0006: Remove the Pullfrog workflow

Status: accepted

## Context

Pullfrog is to be removed from the repository's development workflow. After
fast-forwarding to `origin/main`, the branch contains both Pullfrog and Hammer
workflows. Remove Pullfrog while preserving the separately merged Hammer workflow.

## Decision

- Keep `.github/workflows/pullfrog.yml` absent; do not retain a Pullfrog workflow
  at that path.
- Leave other workflows and application code unchanged.
- Preserve `.github/workflows/hammer.yml` unchanged. It arrived through the
  fast-forward and is not installed or modified by this removal task.

## Consequences

- The repository has no Pullfrog automation defined by that workflow file.
- The separately merged Hammer workflow is unaffected by this removal.
- The absence of this file does not establish the state of external GitHub Apps
  or repository settings.

## Notes

The removal deletes the tracked `.github/workflows/pullfrog.yml` file. This record
is retained and updated rather than duplicated. No earlier Pullfrog adoption
record exists to mark as deprecated or superseeded.
