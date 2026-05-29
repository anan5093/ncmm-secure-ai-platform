package ncmm.authz

import rego.v1

default allow = false
default deny = false

# ─── Allow Rules ────────────────────────────────────────────────────────────────

# Base ABAC: clearance level sufficient AND same department
allow if {
    input.user.clearance_level >= input.document.clearance_level
    input.user.department == input.document.department
}

# Port Inspector: same clearance + department + must match assigned port
allow if {
    input.user.role == "ROLE_PORT_INSPECTOR"
    input.user.clearance_level >= input.document.clearance_level
    input.user.department == input.document.department
    input.document.port_code == input.user.assigned_port
}

# Mission Director override: clearance level 5 can read any document
allow if {
    input.user.clearance_level >= 5
}

# ─── Deny Rules ─────────────────────────────────────────────────────────────────

# SysAdmin cannot read intelligence documents (separation of duties)
deny if {
    input.user.role == "ROLE_SYSADMIN"
    input.resource.type == "document"
}
