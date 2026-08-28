import {
  Inbox,
  ListChecks,
  Cog,
  Wrench,
  Package,
  Clock,
  CircleCheck,
  CircleSlash,
  Archive,
} from "lucide-react";

// Status -> presentation config. Colors are read from CSS variables
// (see index.css) so light/dark themes are handled automatically.
export const STATUS = {
  new: { label: "New" },
  in_progress: { label: "In Progress" },
  waiting_for_part: { label: "Waiting for Part" },
  ready: { label: "Fixed" },
  could_not_fix: { label: "Could Not Fix" },
  picked_up: { label: "Picked Up" },
};

export const STATUS_ORDER = [
  "new",
  "in_progress",
  "waiting_for_part",
  "ready",
  "could_not_fix",
  "picked_up",
];

// Statuses that belong to the active work group.
export const IN_PROGRESS_STATUSES = ["in_progress", "waiting_for_part"];

// Sidebar navigation hierarchy (monochrome lucide icons, no colour).
export const NAV = [
  { type: "item", id: "incoming", icon: Inbox, labelKey: "nav.incoming", statuses: ["new"] },
  {
    type: "item",
    id: "active",
    icon: ListChecks,
    labelKey: "nav.active",
    statuses: ["new", "in_progress", "waiting_for_part", "ready", "could_not_fix"],
  },
  {
    type: "group",
    id: "grp_in_progress",
    icon: Cog,
    labelKey: "nav.group.in_progress",
    statuses: ["in_progress", "waiting_for_part"],
    children: [
      { id: "in_progress", icon: Wrench, labelKey: "nav.repair_in_progress", statuses: ["in_progress"] },
      { id: "waiting_for_part", icon: Package, labelKey: "nav.waiting_for_part", statuses: ["waiting_for_part"] },
    ],
  },
  {
    type: "group",
    id: "grp_completed",
    icon: Clock,
    labelKey: "nav.group.completed",
    statuses: ["ready", "could_not_fix"],
    children: [
      { id: "ready", icon: CircleCheck, labelKey: "nav.fixed", statuses: ["ready"] },
      { id: "could_not_fix", icon: CircleSlash, labelKey: "nav.could_not_fix", statuses: ["could_not_fix"] },
    ],
  },
  { type: "item", id: "closed", icon: Archive, labelKey: "nav.closed", statuses: ["picked_up"] },
];

// view id -> statuses included (for the list query)
export const VIEW_STATUSES = {
  incoming: ["new"],
  active: ["new", "in_progress", "waiting_for_part", "ready", "could_not_fix"],
  grp_in_progress: ["in_progress", "waiting_for_part"],
  in_progress: ["in_progress"],
  waiting_for_part: ["waiting_for_part"],
  grp_completed: ["ready", "could_not_fix"],
  ready: ["ready"],
  could_not_fix: ["could_not_fix"],
  closed: ["picked_up"],
};

// view id -> i18n label key (for topbar / mobile chips)
export const VIEW_LABEL_KEY = {
  incoming: "nav.incoming",
  active: "nav.active",
  grp_in_progress: "nav.group.in_progress",
  in_progress: "nav.repair_in_progress",
  waiting_for_part: "nav.waiting_for_part",
  grp_completed: "nav.group.completed",
  ready: "nav.fixed",
  could_not_fix: "nav.could_not_fix",
  closed: "nav.closed",
};

// status -> view to select after create / auto-navigation
export const STATUS_VIEW = {
  new: "incoming",
  in_progress: "in_progress",
  waiting_for_part: "waiting_for_part",
  ready: "ready",
  could_not_fix: "could_not_fix",
  picked_up: "closed",
};

// Leaf views for compact (mobile) navigation
export const MOBILE_VIEWS = [
  "incoming",
  "active",
  "in_progress",
  "waiting_for_part",
  "ready",
  "could_not_fix",
  "closed",
];

export const statusLabel = (s) => STATUS[s]?.label ?? s;

// Accessory checklist keys (labels translated via i18n: acc.<key>)
export const ACCESSORIES = ["charger", "bag_case", "mouse", "no_accessories"];

// Device types (value keys; labels are translated via i18n: device.<key>)
export const DEVICE_TYPES = [
  "hard_disk",
  "ssd",
  "external_drive",
  "usb_flash",
  "memory_card",
  "raid_array",
  "nas",
  "server_storage",
  "mobile_storage",
  "other_storage",
];

export const DAMAGE_CATEGORIES = [
  "data_recovery",
  "deleted_data",
  "formatted_media",
  "partition_file_system",
  "logical_damage",
  "bad_sectors",
  "mechanical_damage",
  "electronic_damage",
  "firmware_controller",
  "nand_flash",
  "raid_configuration",
  "liquid_damage",
  "fire_damage",
  "other",
];

// Inline style helpers backed by CSS variables.
export const rowStyle = (status) => ({
  "--row-accent": `hsl(var(--status-${status}-accent))`,
  backgroundColor: `hsl(var(--status-${status}-tint))`,
});

export const accentColor = (status) => `hsl(var(--status-${status}-accent))`;

export const badgeStyle = (status) => ({
  backgroundColor: `hsl(var(--status-${status}-badge-bg))`,
  color: `hsl(var(--status-${status}-badge-fg))`,
});
