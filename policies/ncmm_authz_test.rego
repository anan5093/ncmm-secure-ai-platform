package ncmm.authz

import rego.v1

# ─── Test fixtures ───────────────────────────────────────────────────────────────

port_inspector_vizag := {
    "role": "ROLE_PORT_INSPECTOR",
    "clearance_level": 2,
    "department": "PORT_OPS",
    "assigned_port": "VIZAG"
}

port_inspector_jnpt := {
    "role": "ROLE_PORT_INSPECTOR",
    "clearance_level": 2,
    "department": "PORT_OPS",
    "assigned_port": "JNPT"
}

logistics_analyst := {
    "role": "ROLE_LOGISTICS_ANALYST",
    "clearance_level": 3,
    "department": "LOGISTICS"
}

mission_director := {
    "role": "ROLE_MISSION_DIRECTOR",
    "clearance_level": 5,
    "department": "MISSION_HQ"
}

sysadmin := {
    "role": "ROLE_SYSADMIN",
    "clearance_level": 1,
    "department": "IT_OPS"
}

# ─── Document fixtures ───────────────────────────────────────────────────────────

vizag_l1_doc := {
    "clearance_level": 1,
    "department": "PORT_OPS",
    "port_code": "VIZAG",
    "document_category": "port_manifest"
}

jnpt_l1_doc := {
    "clearance_level": 1,
    "department": "PORT_OPS",
    "port_code": "JNPT",
    "document_category": "port_manifest"
}

logistics_l3_doc := {
    "clearance_level": 3,
    "department": "LOGISTICS",
    "document_category": "stockpile_assessment"
}

mission_l5_doc := {
    "clearance_level": 5,
    "department": "MISSION_HQ",
    "document_category": "intelligence_report"
}

# ─── ROLE_PORT_INSPECTOR (VIZAG) tests ─────────────────────────────────────────

test_port_inspector_vizag_allows_vizag_doc if {
    allow with input as {
        "user": port_inspector_vizag,
        "document": vizag_l1_doc,
        "resource": {"type": "document"}
    }
}

test_port_inspector_vizag_denies_jnpt_doc if {
    not allow with input as {
        "user": port_inspector_vizag,
        "document": jnpt_l1_doc,
        "resource": {"type": "document"}
    }
}

test_port_inspector_vizag_denies_l3_doc if {
    not allow with input as {
        "user": port_inspector_vizag,
        "document": logistics_l3_doc,
        "resource": {"type": "document"}
    }
}

test_port_inspector_vizag_denies_l5_doc if {
    not allow with input as {
        "user": port_inspector_vizag,
        "document": mission_l5_doc,
        "resource": {"type": "document"}
    }
}

# ─── ROLE_PORT_INSPECTOR (JNPT) tests ──────────────────────────────────────────

test_port_inspector_jnpt_allows_jnpt_doc if {
    allow with input as {
        "user": port_inspector_jnpt,
        "document": jnpt_l1_doc,
        "resource": {"type": "document"}
    }
}

test_port_inspector_jnpt_denies_vizag_doc if {
    not allow with input as {
        "user": port_inspector_jnpt,
        "document": vizag_l1_doc,
        "resource": {"type": "document"}
    }
}

# ─── ROLE_LOGISTICS_ANALYST tests ──────────────────────────────────────────────

test_logistics_analyst_allows_l3_logistics_doc if {
    allow with input as {
        "user": logistics_analyst,
        "document": logistics_l3_doc,
        "resource": {"type": "document"}
    }
}

test_logistics_analyst_denies_l5_doc if {
    not allow with input as {
        "user": logistics_analyst,
        "document": mission_l5_doc,
        "resource": {"type": "document"}
    }
}

test_logistics_analyst_denies_port_doc if {
    not allow with input as {
        "user": logistics_analyst,
        "document": vizag_l1_doc,
        "resource": {"type": "document"}
    }
}

# ─── ROLE_MISSION_DIRECTOR tests ───────────────────────────────────────────────

test_mission_director_allows_l5_doc if {
    allow with input as {
        "user": mission_director,
        "document": mission_l5_doc,
        "resource": {"type": "document"}
    }
}

test_mission_director_allows_any_doc_via_clearance5 if {
    allow with input as {
        "user": mission_director,
        "document": vizag_l1_doc,
        "resource": {"type": "document"}
    }
}

test_mission_director_allows_logistics_doc if {
    allow with input as {
        "user": mission_director,
        "document": logistics_l3_doc,
        "resource": {"type": "document"}
    }
}

# ─── ROLE_SYSADMIN tests ───────────────────────────────────────────────────────

test_sysadmin_denied_document_access if {
    deny with input as {
        "user": sysadmin,
        "document": vizag_l1_doc,
        "resource": {"type": "document"}
    }
}

test_sysadmin_not_allowed_document if {
    not allow with input as {
        "user": sysadmin,
        "document": vizag_l1_doc,
        "resource": {"type": "document"}
    }
}

test_sysadmin_allowed_non_document_resource if {
    allow with input as {
        "user": {"role": "ROLE_SYSADMIN", "clearance_level": 5, "department": "IT_OPS"},
        "document": {"clearance_level": 1, "department": "IT_OPS"},
        "resource": {"type": "metrics"}
    }
}

# ─── Default deny tests ─────────────────────────────────────────────────────────

test_default_deny_unauthenticated if {
    not allow with input as {
        "user": {},
        "document": vizag_l1_doc,
        "resource": {"type": "document"}
    }
}

test_deny_false_for_normal_users if {
    not deny with input as {
        "user": logistics_analyst,
        "document": logistics_l3_doc,
        "resource": {"type": "document"}
    }
}
