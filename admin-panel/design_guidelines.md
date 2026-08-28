{
  "design_personality": {
    "keywords": [
      "modern minimal",
      "Outlook-style productivity",
      "high-density but calm",
      "thin borders",
      "subtle elevation",
      "fast scanning",
      "low eye strain"
    ],
    "north_star": "A three-pane workspace that feels like a premium email client: crisp separators, quiet surfaces, and status communicated via subtle tints + a 3px accent bar (never loud fills).",
    "do_not": [
      "Do not center-align the app container.",
      "Do not use heavy gradients or saturated fills for rows.",
      "Do not use purple gradients anywhere (status purple is allowed only as a semantic status token).",
      "Do not use universal transitions (transition: all)."
    ]
  },
  "layout": {
    "app_shell": {
      "pattern": "3-panel resizable (left folders / middle list / right detail)",
      "implementation": "Use shadcn Resizable (src/components/ui/resizable.jsx) OR react-resizable-panels if already wired; keep independent scroll per panel.",
      "dimensions": {
        "left_panel": {
          "default": "260px",
          "min": "220px",
          "max": "320px"
        },
        "middle_panel": {
          "default": "420px",
          "min": "320px",
          "max": "560px"
        },
        "right_panel": {
          "default": "520px",
          "min": "360px",
          "max": "720px"
        },
        "topbar_height": "52px",
        "row_height": "56px (dense), 64px (comfortable)"
      },
      "grid_and_spacing": {
        "outer_padding": "p-3 sm:p-4",
        "panel_padding": "p-3",
        "section_gap": "gap-2",
        "field_gap": "gap-2.5",
        "list_gap": "space-y-1"
      },
      "scrolling": {
        "rule": "Each panel scrolls independently; headers (search/filter bar, detail header) remain sticky.",
        "tailwind": {
          "panel": "min-h-0 overflow-hidden",
          "panel_scroll": "h-full overflow-auto",
          "sticky_header": "sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        }
      },
      "mobile_behavior": {
        "pattern": "Stacked panes with a segmented control",
        "rule": "On <768px: show one pane at a time (Folders / List / Detail). Use Tabs or a top segmented control; Detail opens as Drawer/Sheet.",
        "components": [
          "tabs (src/components/ui/tabs.jsx)",
          "sheet or drawer (src/components/ui/sheet.jsx or drawer.jsx)"
        ]
      }
    }
  },
  "typography": {
    "font_pairing": {
      "ui": {
        "family": "Manrope",
        "fallback": "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
        "usage": "All UI text"
      },
      "mono": {
        "family": "IBM Plex Mono",
        "usage": "Ticket IDs, part numbers, timestamps (optional)"
      },
      "how_to_load": {
        "google_fonts": [
          "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
        ],
        "apply": "Set in index.css body { font-family: var(--font-sans); } and define --font-sans/--font-mono tokens."
      }
    },
    "type_scale_tailwind": {
      "h1": "text-4xl sm:text-5xl lg:text-6xl (rarely used; internal tool)",
      "h2": "text-base md:text-lg",
      "panel_title": "text-sm font-semibold tracking-tight",
      "row_primary": "text-sm font-medium",
      "row_secondary": "text-xs text-muted-foreground",
      "form_label": "text-xs font-medium text-muted-foreground",
      "body": "text-sm sm:text-base",
      "small": "text-xs"
    },
    "numbers": {
      "rule": "Use tabular numbers for timestamps/costs",
      "tailwind": "[font-variant-numeric:tabular-nums]"
    }
  },
  "color_system": {
    "brand_intent": "Neutral graphite surfaces with an ocean-teal focus ring and calm semantic statuses. Status colors are subtle tints + accent bars.",
    "tokens_css_variables": {
      "note": "These map onto shadcn HSL tokens in index.css (:root and .dark). Keep existing token names; add new semantic tokens below.",
      "light": {
        "--background": "210 20% 98%",
        "--foreground": "222 22% 12%",
        "--card": "0 0% 100%",
        "--card-foreground": "222 22% 12%",
        "--popover": "0 0% 100%",
        "--popover-foreground": "222 22% 12%",
        "--primary": "222 22% 12%",
        "--primary-foreground": "210 20% 98%",
        "--secondary": "210 18% 95%",
        "--secondary-foreground": "222 22% 12%",
        "--muted": "210 18% 95%",
        "--muted-foreground": "215 14% 42%",
        "--accent": "210 18% 95%",
        "--accent-foreground": "222 22% 12%",
        "--border": "214 18% 86%",
        "--input": "214 18% 86%",
        "--ring": "186 72% 34%",
        "--radius": "10px",
        "--surface-0": "210 20% 98%",
        "--surface-1": "0 0% 100%",
        "--surface-2": "210 18% 96%",
        "--shadow-color": "222 22% 12%",
        "--shadow-1": "0 1px 2px hsl(var(--shadow-color) / 0.06)",
        "--shadow-2": "0 6px 18px hsl(var(--shadow-color) / 0.08)",
        "--focus": "186 72% 34%",
        "--selection": "186 72% 34%"
      },
      "dark": {
        "--background": "222 22% 8%",
        "--foreground": "210 20% 96%",
        "--card": "222 22% 10%",
        "--card-foreground": "210 20% 96%",
        "--popover": "222 22% 10%",
        "--popover-foreground": "210 20% 96%",
        "--primary": "210 20% 96%",
        "--primary-foreground": "222 22% 10%",
        "--secondary": "222 18% 14%",
        "--secondary-foreground": "210 20% 96%",
        "--muted": "222 18% 14%",
        "--muted-foreground": "215 14% 68%",
        "--accent": "222 18% 14%",
        "--accent-foreground": "210 20% 96%",
        "--border": "222 16% 18%",
        "--input": "222 16% 18%",
        "--ring": "186 70% 44%",
        "--radius": "10px",
        "--surface-0": "222 22% 8%",
        "--surface-1": "222 22% 10%",
        "--surface-2": "222 18% 14%",
        "--shadow-color": "0 0% 0%",
        "--shadow-1": "0 1px 2px hsl(var(--shadow-color) / 0.35)",
        "--shadow-2": "0 10px 24px hsl(var(--shadow-color) / 0.45)",
        "--focus": "186 70% 44%",
        "--selection": "186 70% 44%"
      }
    },
    "status_tokens": {
      "usage_rule": "Ticket rows use: (1) a 3px left accent bar, (2) a very light row tint, (3) a badge with subtle fill. Never full-saturation row fills.",
      "light": {
        "incoming_new_gray": {
          "accent": "220 8% 52%",
          "row_tint": "220 18% 96%",
          "badge_bg": "220 18% 94%",
          "badge_fg": "222 18% 22%"
        },
        "in_progress_yellow": {
          "accent": "42 92% 38%",
          "row_tint": "44 100% 96%",
          "badge_bg": "44 100% 92%",
          "badge_fg": "28 70% 18%"
        },
        "waiting_for_part_blue": {
          "accent": "205 88% 40%",
          "row_tint": "205 90% 96%",
          "badge_bg": "205 90% 92%",
          "badge_fg": "210 70% 18%"
        },
        "ready_green": {
          "accent": "152 62% 34%",
          "row_tint": "150 55% 96%",
          "badge_bg": "150 55% 92%",
          "badge_fg": "155 55% 18%"
        },
        "could_not_fix_red": {
          "accent": "0 78% 46%",
          "row_tint": "0 85% 96%",
          "badge_bg": "0 85% 92%",
          "badge_fg": "0 65% 22%"
        },
        "picked_up_purple": {
          "accent": "270 55% 46%",
          "row_tint": "270 70% 97%",
          "badge_bg": "270 70% 93%",
          "badge_fg": "270 45% 22%"
        }
      },
      "dark": {
        "incoming_new_gray": {
          "accent": "220 10% 62%",
          "row_tint": "222 18% 12%",
          "badge_bg": "222 16% 16%",
          "badge_fg": "210 20% 92%"
        },
        "in_progress_yellow": {
          "accent": "44 92% 56%",
          "row_tint": "44 40% 14%",
          "badge_bg": "44 45% 18%",
          "badge_fg": "44 90% 88%"
        },
        "waiting_for_part_blue": {
          "accent": "205 90% 58%",
          "row_tint": "205 40% 14%",
          "badge_bg": "205 45% 18%",
          "badge_fg": "205 90% 90%"
        },
        "ready_green": {
          "accent": "152 62% 52%",
          "row_tint": "152 35% 13%",
          "badge_bg": "152 40% 17%",
          "badge_fg": "152 70% 88%"
        },
        "could_not_fix_red": {
          "accent": "0 78% 60%",
          "row_tint": "0 35% 14%",
          "badge_bg": "0 40% 18%",
          "badge_fg": "0 85% 90%"
        },
        "picked_up_purple": {
          "accent": "270 55% 66%",
          "row_tint": "270 28% 14%",
          "badge_bg": "270 32% 18%",
          "badge_fg": "270 70% 90%"
        }
      },
      "css_mapping_suggestion": {
        "note": "Implement as CSS variables like --status-in-progress-accent etc in :root and .dark, then use utility classes via arbitrary values.",
        "example": "style={{ '--row-accent': 'hsl(var(--status-in-progress-accent))' }}"
      }
    },
    "selection_and_hover": {
      "row_hover": "bg-accent/60 (light) and bg-accent/40 (dark)",
      "row_selected": "ring-1 ring-ring/40 bg-accent/70 (light) bg-accent/50 (dark)",
      "rule": "Selection must remain visible even on tinted rows; keep tint subtle and add ring for selected."
    },
    "gradients_and_texture": {
      "rule": "No large gradients; use a tiny topbar hairline gradient or a 12px tall header wash only if needed (<20% viewport).",
      "allowed_example": "Topbar background: linear-gradient(180deg, hsl(var(--surface-2)) 0%, hsl(var(--surface-1)) 100%)",
      "noise_overlay": {
        "use": "Add subtle noise via CSS (preferred) or a tiny repeating PNG.",
        "image_urls": [
          {
            "category": "optional-background-texture",
            "description": "Neutral paper texture (very subtle). Use as overlay at 0.04–0.06 opacity.",
            "url": "https://images.pexels.com/photos/12555186/pexels-photo-12555186.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
          },
          {
            "category": "optional-background-texture",
            "description": "Neutral textured paper surface (alternate).",
            "url": "https://images.pexels.com/photos/7599590/pexels-photo-7599590.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
          }
        ]
      }
    }
  },
  "components": {
    "component_path": {
      "shadcn_primary": [
        "/app/frontend/src/components/ui/resizable.jsx",
        "/app/frontend/src/components/ui/scroll-area.jsx",
        "/app/frontend/src/components/ui/input.jsx",
        "/app/frontend/src/components/ui/button.jsx",
        "/app/frontend/src/components/ui/badge.jsx",
        "/app/frontend/src/components/ui/select.jsx",
        "/app/frontend/src/components/ui/textarea.jsx",
        "/app/frontend/src/components/ui/dialog.jsx",
        "/app/frontend/src/components/ui/alert-dialog.jsx",
        "/app/frontend/src/components/ui/separator.jsx",
        "/app/frontend/src/components/ui/switch.jsx",
        "/app/frontend/src/components/ui/tabs.jsx",
        "/app/frontend/src/components/ui/tooltip.jsx",
        "/app/frontend/src/components/ui/sonner.jsx"
      ],
      "icons": "lucide-react"
    },
    "topbar": {
      "structure": "Left: app name + current folder; Center: global search; Right: create ticket button + theme toggle",
      "classes": {
        "wrap": "h-[52px] px-3 sm:px-4 flex items-center gap-3 border-b bg-background/80 backdrop-blur",
        "title": "text-sm font-semibold tracking-tight",
        "search": "w-full max-w-[520px]",
        "actions": "ml-auto flex items-center gap-2"
      },
      "data_testids": {
        "global_search": "global-search-input",
        "create_ticket": "create-ticket-button",
        "theme_toggle": "theme-toggle-switch"
      }
    },
    "folder_sidebar": {
      "item": {
        "pattern": "Button-like row with icon, label, count pill; active state uses subtle bg + left indicator",
        "classes": {
          "item": "group w-full flex items-center gap-2 rounded-md px-2.5 py-2 text-sm hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
          "active": "bg-accent/70 text-foreground",
          "left_indicator": "relative before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:rounded-full before:bg-ring",
          "count": "ml-auto text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground [font-variant-numeric:tabular-nums]"
        },
        "data_testids": {
          "folder_item": "folder-item",
          "folder_count": "folder-count"
        }
      }
    },
    "ticket_list": {
      "header": {
        "pattern": "Sticky search + filters row",
        "components": ["input", "select", "button"],
        "classes": {
          "wrap": "sticky top-0 z-10 border-b bg-background/80 backdrop-blur p-3",
          "row": "flex items-center gap-2",
          "filters": "ml-auto flex items-center gap-2"
        },
        "data_testids": {
          "list_search": "ticket-list-search-input",
          "status_filter": "ticket-list-status-filter",
          "assignee_filter": "ticket-list-assignee-filter"
        }
      },
      "row": {
        "pattern": "Clickable row (button) with left accent bar + tint; shows primary line + secondary meta; right side has status badge + updated time",
        "classes": {
          "row": "group relative w-full text-left rounded-md px-3 py-2.5 border border-border/60 bg-card hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
          "accent_bar": "before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:rounded-full before:bg-[hsl(var(--row-accent))]",
          "tint": "bg-[hsl(var(--row-tint))]",
          "selected": "ring-1 ring-ring/40",
          "primary": "flex items-center gap-2",
          "title": "text-sm font-medium truncate",
          "meta": "mt-0.5 flex items-center gap-2 text-xs text-muted-foreground",
          "right": "ml-auto flex items-center gap-2"
        },
        "status_badge": {
          "component": "badge (variant=secondary or custom)",
          "classes": "rounded-md px-2 py-0.5 text-xs bg-[hsl(var(--badge-bg))] text-[hsl(var(--badge-fg))] border border-border/50"
        },
        "data_testids": {
          "ticket_row": "ticket-row",
          "ticket_status_badge": "ticket-status-badge",
          "ticket_updated_at": "ticket-updated-at"
        }
      },
      "performance": {
        "rule": "If list grows large, consider virtualization (react-window). Keep row height fixed for smooth scroll.",
        "avoid": "Avoid heavy box-shadows per row; use border + subtle tint instead."
      }
    },
    "detail_panel": {
      "header": {
        "pattern": "Sticky header with ticket title + quick actions (delete, close) + status select",
        "classes": {
          "wrap": "sticky top-0 z-10 border-b bg-background/80 backdrop-blur p-3",
          "title": "text-sm font-semibold",
          "sub": "text-xs text-muted-foreground",
          "actions": "ml-auto flex items-center gap-2"
        },
        "data_testids": {
          "detail_status_select": "ticket-detail-status-select",
          "detail_delete": "ticket-detail-delete-button"
        }
      },
      "fields": {
        "pattern": "Two-column form on desktop, single column on mobile",
        "classes": {
          "grid": "grid grid-cols-1 md:grid-cols-2 gap-3 p-3",
          "field": "space-y-1",
          "label": "text-xs font-medium text-muted-foreground",
          "input": "h-9",
          "textarea": "min-h-[120px]"
        },
        "data_testids": {
          "customer_name": "ticket-detail-customer-name-input",
          "customer_phone": "ticket-detail-customer-phone-input",
          "device": "ticket-detail-device-input",
          "issue": "ticket-detail-issue-textarea",
          "estimate": "ticket-detail-estimate-input",
          "assignee": "ticket-detail-assignee-select",
          "part_info": "ticket-detail-part-info-input"
        }
      },
      "activity_timeline": {
        "pattern": "Vertical timeline with subtle left rail; add-note composer pinned at top of timeline section",
        "components": ["textarea", "button", "separator"],
        "classes": {
          "wrap": "p-3",
          "rail": "relative pl-4 before:absolute before:left-1 before:top-2 before:bottom-2 before:w-px before:bg-border",
          "item": "relative pb-4",
          "dot": "absolute -left-[3px] top-1 h-2 w-2 rounded-full bg-muted-foreground/60",
          "meta": "text-xs text-muted-foreground [font-variant-numeric:tabular-nums]",
          "body": "mt-1 text-sm"
        },
        "data_testids": {
          "add_note_textarea": "ticket-activity-add-note-textarea",
          "add_note_button": "ticket-activity-add-note-button",
          "timeline_item": "ticket-activity-timeline-item"
        }
      }
    },
    "modals": {
      "create_ticket": {
        "component": "dialog (src/components/ui/dialog.jsx)",
        "pattern": "Form with required fields; primary CTA bottom-right",
        "data_testids": {
          "open": "create-ticket-open-dialog",
          "submit": "create-ticket-submit-button",
          "cancel": "create-ticket-cancel-button"
        }
      },
      "delete_confirm": {
        "component": "alert-dialog (src/components/ui/alert-dialog.jsx)",
        "data_testids": {
          "confirm": "delete-ticket-confirm-button",
          "cancel": "delete-ticket-cancel-button"
        }
      }
    },
    "toasts": {
      "library": "sonner",
      "component_path": "/app/frontend/src/components/ui/sonner.jsx",
      "usage": "Use for create/update/delete success + error; keep copy short and actionable.",
      "data_testids": {
        "toast_region": "toast-region"
      }
    }
  },
  "motion_and_microinteractions": {
    "principles": [
      "Fast, subtle, productivity-first",
      "Prefer opacity/color/border transitions; avoid transform-heavy animations on dense lists",
      "Respect prefers-reduced-motion"
    ],
    "durations": {
      "fast": "120ms",
      "base": "160ms",
      "slow": "220ms"
    },
    "easings": {
      "standard": "cubic-bezier(0.2, 0.8, 0.2, 1)",
      "out": "cubic-bezier(0.16, 1, 0.3, 1)"
    },
    "tailwind_examples": {
      "button": "transition-colors duration-150",
      "row": "transition-colors duration-150",
      "panel_resize_handle": "transition-colors duration-150 hover:bg-border"
    },
    "framer_motion_optional": {
      "use_cases": [
        "Detail panel content crossfade when switching tickets",
        "Timeline item enter animation"
      ],
      "rule": "Do not animate the entire list on every update; only animate small regions."
    }
  },
  "accessibility": {
    "requirements": [
      "WCAG AA contrast for text and badges",
      "Visible focus rings (ring-ring/40) on all interactive elements",
      "Keyboard navigation: folder list, ticket list, status select",
      "Use aria-labels for icon-only buttons",
      "Respect prefers-reduced-motion"
    ],
    "density": {
      "rule": "Keep hit targets >= 40px height for touch; rows are 56px+.",
      "note": "Even internal tools benefit from touch-friendly sizing for tablets."
    }
  },
  "dark_light_mode": {
    "implementation": "Use next-themes (already available) to toggle .dark class on html/body. Ensure all colors come from CSS variables.",
    "toggle_component": "switch (src/components/ui/switch.jsx)",
    "data_testid": "theme-toggle-switch"
  },
  "libraries": {
    "recommended": [
      {
        "name": "react-resizable-panels OR shadcn resizable",
        "why": "Three-pane Outlook-style resizing",
        "notes": "Prefer existing installed approach; keep panel sizes persisted in localStorage."
      },
      {
        "name": "framer-motion (optional)",
        "why": "Small crossfades and timeline entrance animations",
        "notes": "Use sparingly to avoid perf issues in dense lists."
      }
    ]
  },
  "image_urls": [
    {
      "category": "optional-background-texture",
      "description": "Neutral paper texture overlay (0.04–0.06 opacity) for non-flat surfaces.",
      "url": "https://images.pexels.com/photos/12555186/pexels-photo-12555186.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
    },
    {
      "category": "optional-background-texture",
      "description": "Alternate neutral texture overlay.",
      "url": "https://images.pexels.com/photos/7599590/pexels-photo-7599590.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
    }
  ],
  "instructions_to_main_agent": [
    "Remove CRA default App.css centering/header styles; do not use .App { text-align:center }.",
    "Update index.css tokens to the provided light/dark palette and add semantic status tokens.",
    "Implement 3-pane layout with Resizable; each pane has its own ScrollArea.",
    "Ticket rows: implement CSS variables per row for --row-accent, --row-tint, --badge-bg, --badge-fg based on status.",
    "Ensure status change triggers optimistic UI move between folders; animate only the moved row (optional).",
    "Add data-testid to every interactive element and key info element per mappings above.",
    "Use sonner for toasts; keep messages short (e.g., 'Ticket updated', 'Failed to save')."
  ],
  "general_ui_ux_design_guidelines_appendix": "<General UI UX Design Guidelines>  \n    - You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms\n    - You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text\n   - NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json\n\n **GRADIENT RESTRICTION RULE**\nNEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc\nNEVER use dark gradients for logo, testimonial, footer etc\nNEVER let gradients cover more than 20% of the viewport.\nNEVER apply gradients to text-heavy content or reading areas.\nNEVER use gradients on small UI elements (<100px width).\nNEVER stack multiple gradient layers in the same viewport.\n\n**ENFORCEMENT RULE:**\n    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors\n\n**How and where to use:**\n   • Section backgrounds (not content backgrounds)\n   • Hero section header content. Eg: dark to light to dark color\n   • Decorative overlays and accent elements only\n   • Hero section with 2-3 mild color\n   • Gradients creation can be done for any angle say horizontal, vertical or diagonal\n\n- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**\n\n</Font Guidelines>\n\n- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead. \n   \n- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.\n\n- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.\n   \n- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly\n    Eg: - if it implies playful/energetic, choose a colorful scheme\n           - if it implies monochrome/minimal, choose a black–white/neutral scheme\n\n**Component Reuse:**\n\t- Prioritize using pre-existing components from src/components/ui when applicable\n\t- Create new components that match the style and conventions of existing components when needed\n\t- Examine existing components to understand the project's component patterns before creating new ones\n\n**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component\n\n**Best Practices:**\n\t- Use Shadcn/UI as the primary component library for consistency and accessibility\n\t- Import path: ./components/[component-name]\n\n**Export Conventions:**\n\t- Components MUST use named exports (export const ComponentName = ...)\n\t- Pages MUST use default exports (export default function PageName() {...})\n\n**Toasts:**\n  - Use `sonner` for toasts\"\n  - Sonner component are located in `/app/src/components/ui/sonner.tsx`\n\nUse 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals.\n</General UI UX Design Guidelines>"
}
