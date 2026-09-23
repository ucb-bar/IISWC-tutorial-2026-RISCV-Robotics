/**
 * Attendee lab instructions.
 *
 * Every command and every quoted output below was executed on 2026-09-23 on bench
 * card pynq-2 at 10.42.0.2. Prose that explains *why* belongs in the slides, not on
 * this page: keep entries to the command, one line of orientation, and what the
 * screen should say.
 *
 * "{N}" is the seat placeholder. It is rewritten everywhere by the seat box.
 */

export const SEAT_TOKEN = "{N}";

/** Replace the seat placeholder; an empty seat keeps the literal "N". */
export const fillSeat = (text: string, seat: string): string =>
  text.replaceAll(SEAT_TOKEN, seat.length > 0 ? seat : "N");

export type BlockKind = "cmd" | "out" | "url";

export interface Block {
  kind: BlockKind;
  text: string;
}

export interface Fix {
  symptom: string;
  action: string;
}

export interface ReferenceCommand {
  command: string;
  does: string;
}

export interface Step {
  id: string;
  title: string;
  where: string;
  uplink?: boolean;
  note?: string;
  blocks?: Block[];
  reference?: ReferenceCommand[];
  takeaway?: string;
  fixes?: Fix[];
}

export type UnitStatus = "live" | "partial" | "draft";

export interface Unit {
  id: string;
  eyebrow: string;
  title: string;
  status: UnitStatus;
  note?: string;
  uplink?: boolean;
  steps?: Step[];
  gaps?: string[];
}

export const statusLabels: Record<UnitStatus, string> = {
  live: "Runs on your board today",
  partial: "Part runs today",
  draft: "No attendee steps yet",
};

const units: Unit[] = [
  {
    id: "unit-0",
    eyebrow: "Start here",
    title: "Get a shell, and find your instance",
    status: "live",
    note: "Five short steps. Every unit after this assumes them.",
    steps: [
      {
        id: "0.1",
        title: "Read the OLED",
        where: "At the board · nothing to type",
        note: "`up M:SS` must be ticking: a frozen counter is a dead SoC, not a slow one.",
        blocks: [
          { kind: "out", text: "10.42.0.{N}\niiswc-robotics-tutorial\nup 4:17" },
        ],
        fixes: [
          { symptom: "`up M:SS` is frozen", action: "Power-cycle. The glass holds a stale frame; it must restart at `up 0:00`." },
          { symptom: "`NO ADDRESS`, or `wlan0 DOWN`", action: "Power-cycle. Nothing below works until the board has an address." },
          { symptom: "Blank, and under two minutes", action: "Wait. Raising the network alone takes about 37 s." },
        ],
      },
      {
        id: "0.2",
        title: "SSH into the board",
        where: "On your laptop",
        note: "Join `iiswc-robotics-tutorial` first. The instructor hands out the passphrase, the key and the password.",
        blocks: [
          { kind: "cmd", text: "ssh -i <the key you were given> xilinx@10.42.0.{N}" },
          { kind: "out", text: "Linux pynq-{N} ...\nxilinx@pynq-{N}:~$" },
        ],
        fixes: [
          { symptom: "`REMOTE HOST IDENTIFICATION HAS CHANGED`", action: "Expected on a re-imaged card. `ssh-keygen -f ~/.ssh/known_hosts -R 10.42.0.{N}`" },
          { symptom: "`Permission denied (publickey,password)`", action: "`chmod 600` the key, then try the password fallback." },
          { symptom: "`No route to host`, or it hangs", action: "Wrong network or wrong seat. Re-read the OLED." },
        ],
      },
      {
        id: "0.3",
        title: "Ask the board who it is",
        where: "On the board",
        note: "The same fields as the OLED, read from Linux. If they disagree, believe this.",
        blocks: [
          { kind: "cmd", text: "/opt/iiswc/host/board_id.sh" },
          {
            kind: "out",
            text: "hostname   pynq-{N}\niface      wlan0\nipv4       10.42.0.{N}\nssid       iiswc-robotics-tutorial\nsignal     -21 dBm\nMAGIC      0x5A5A0038\nPL         operating\nderives    aws-{N}.iiswc",
          },
        ],
        fixes: [
          { symptom: "`ipv4  NO ADDRESS`", action: "Back to 0.1." },
          { symptom: "`PL` is anything but `operating`", action: "Power-cycle and let the boot service load the bitstream." },
          { symptom: "`MAGIC  -`", action: "Harmless. Re-run under `sudo` for the number." },
          { symptom: "`MAGIC 0x5A5A0039`", action: "The trace bitstream. Units 1 and 2 want `0x5A5A0038` — a PL reload, not a re-image." },
        ],
      },
      {
        id: "0.4",
        title: "Find your AWS instance",
        where: "On the board",
        uplink: true,
        note: "The board derives its seat from its own address. You never type an IP.",
        blocks: [
          { kind: "cmd", text: "/opt/iiswc/host/aws_whoami.sh" },
          { kind: "out", text: "this board is 10.42.0.{N}, so it is seat {N}\nseat {N}  aws-{N}.iiswc -> 54.x.x.x" },
          { kind: "cmd", text: "/opt/iiswc/host/aws_whoami.sh --check" },
          { kind: "out", text: "tcp/22 open  SSH-2.0-OpenSSH_9.6p1 Ubuntu-3ubuntu13.14" },
        ],
        takeaway: "`--check` logs nobody in. It proves egress works and sshd is listening.",
        fixes: [
          { symptom: "`aws-{N}.iiswc did not resolve`", action: "Room-wide, not yours: only the router at 10.42.0.1 serves `.iiswc` names. Say so out loud." },
          { symptom: "Resolves, but `--check` times out", action: "The instance is down or the phonebook is stale. An instructor republishes it." },
        ],
      },
      {
        id: "0.5",
        title: "The commands every unit uses",
        where: "On the board · reference",
        note: "All of them live in `/opt/iiswc/host/`. The board dials out; AWS cannot reach in.",
        reference: [
          { command: "aws_whoami.sh", does: "Which instance is mine." },
          { command: "aws_ssh.sh", does: "A shell there. `aws_ssh.sh -- uptime` runs one command; the `--` is required." },
          { command: "aws_push.sh", does: "Board to instance, md5-checked at both ends." },
          { command: "aws_pull.sh", does: "Instance to board. A name or an IP." },
          { command: "aws_run.sh", does: "Pull the image, load it, watch the console." },
        ],
        blocks: [
          { kind: "cmd", text: "/opt/iiswc/host/aws_ssh.sh -- hostname" },
          { kind: "out", text: "ip-192-168-0-205" },
        ],
        fixes: [
          { symptom: "`no private key at .../iiswc-2026-tutorial.pem`", action: "An instructor puts it back; you cannot." },
          { symptom: "`is mode 644; ssh will refuse it`", action: "`chmod 600 ~/.ssh/iiswc-2026-tutorial.pem`" },
        ],
      },
    ],
  },
  {
    id: "unit-1",
    eyebrow: "Unit one",
    title: "Zephyr and Chipyard: build on the cloud, run on your SoC",
    status: "live",
    uplink: true,
    note: "Your card is a runtime with no toolchain. Build on the instance, run on the silicon.",
    steps: [
      {
        id: "1.1",
        title: "Open a shell on your instance",
        where: "On the board",
        note: "No argument: it asks `aws_whoami.sh`. The missing host-key warning is deliberate.",
        blocks: [
          { kind: "cmd", text: "/opt/iiswc/host/aws_ssh.sh" },
          { kind: "out", text: "Welcome to Ubuntu 24.04 LTS ...\nubuntu@ip-192-168-0-205:~$" },
        ],
        fixes: [
          { symptom: "Anything about the seat or the name", action: "That is step 0.4, not this one." },
          { symptom: "It drops after a few idle minutes", action: "Reconnect. The build is on the instance, not in your session." },
        ],
      },
      {
        id: "1.2",
        title: "Build a Zephyr image for the Rocket SoC",
        where: "On the instance",
        note: "About thirteen seconds. `samples/boot_info` is the guest your board is running now.",
        blocks: [
          {
            kind: "cmd",
            text: "cd /home/ubuntu/tut\nwest build -p always -b chipyard_pynqz1_all_f40 \\\n    -d ~/out/boot_info samples/boot_info \\\n    -- -DBOARD_ROOT=/home/ubuntu/tut",
          },
          {
            kind: "out",
            text: "-- west build: building application\n...\nMemory region         Used Size  Region Size  %age Used\n             RAM:       69720 B       256 MB      0.03%",
          },
          { kind: "cmd", text: "ls -l ~/out/boot_info/zephyr/zephyr.bin" },
          { kind: "out", text: "-rw-rw-r-- 1 ubuntu ubuntu 55536 ... zephyr.bin" },
        ],
        takeaway: "The board name is load-bearing: `chipyard_pynqz1_all_f40`, never plain `chipyard_pynqz1`. The wrong one boots dead.",
        fixes: [
          { symptom: "`west: command not found`", action: "`source /home/ubuntu/tut/env.sh`" },
          { symptom: "CMake names a missing toolchain file", action: "It names the wrong thing: `ZEPHYR_SDK_INSTALL_DIR` points at another SDK." },
          { symptom: "CMake cannot find a source under `samples/`", action: "The instance image is behind. Say so." },
        ],
      },
      {
        id: "1.3",
        title: "Put it where the board will look",
        where: "On the instance",
        note: "`~/pub/` has no producer in the repository. This copy is the missing link.",
        blocks: [
          { kind: "cmd", text: "mkdir -p ~/pub && cp ~/out/boot_info/zephyr/zephyr.bin ~/pub/zephyr.bin" },
          { kind: "out", text: "-rw-rw-r-- 1 ubuntu ubuntu 55536 ... /home/ubuntu/pub/zephyr.bin" },
        ],
        takeaway: "Or skip the directory: set `AWS_IMAGE=out/boot_info/zephyr/zephyr.bin` on the next command.",
      },
      {
        id: "1.4",
        title: "Pull it, load it, watch it run",
        where: "On the board",
        note: "Log out of the instance first. One command: pull, load the PL, start the guest, read the console.",
        blocks: [
          { kind: "cmd", text: "/opt/iiswc/host/aws_run.sh aws-{N}.iiswc" },
          {
            kind: "out",
            text: "==> 1/4  pull pub/zephyr.bin from aws-{N}.iiswc\n    pulled pub/zephyr.bin  (55536 bytes, 1.612 s)\n==> 2/4  check nobody else is reading the console\n==> 3/4  load the PL and start the guest\n==> 4/4  console\n    *** Booting Zephyr OS build 4329bf61c4fe ***\n    BI_STATUS state=PRESENT nonce=0x649bce5f soc_magic=0x5A5A0038\n    BI_NET host=pynq-{N} ipv4=10.42.0.{N} link_up=1\n    2156 bytes of console in /home/xilinx/tutorial/console.out",
          },
        ],
        takeaway: "The two nonces must match — DRAM is not cleared between loads. The OLED restarts at `up 0:00`.",
        fixes: [
          { symptom: "`[fail] 0 console bytes`", action: "Stop and say so. Do not retry and do not reboot." },
          { symptom: "The console is garbage characters", action: "Wrong clock: the guest was built for the wrong board. Rebuild for `chipyard_pynqz1_all_f40`." },
          { symptom: "`another console reader is already on /dev/ttyPS1`", action: "Kill the PID it prints, never a pattern." },
          { symptom: "Banner only, no `BI_` lines", action: "The reader started late. The full text is in `/home/xilinx/tutorial/console.out`." },
        ],
      },
    ],
    gaps: [
      "Proven twice on the bench board, never yet on a card from the imaging flow — so zero console bytes may be that, not you.",
    ],
  },
  {
    id: "unit-2",
    eyebrow: "Unit two",
    title: "ModelBlaster: a network compiled to kernels you can beat",
    status: "draft",
    note: "Compile a PyTorch model to int8 kernels for this SoC, replace one, and prove it is identical rather than merely faster.",
    steps: [
      {
        id: "2.1",
        title: "Optional: the kernel gate",
        where: "On any clone of the repository, with gcc",
        note: "No board, no lock, no cross-compiler. Takes no arguments; exits with the number of failures.",
        blocks: [
          { kind: "cmd", text: "fpga/pynq-z2/modelblaster/kernels/pext_nl/test/b76_gate.sh" },
        ],
      },
    ],
    gaps: [
      "No attendee sequence yet: every ModelBlaster lab is developer-facing — bench-board lock, 18 GB toolchain, repository checkout — and your card carries none of it.",
    ],
  },
  {
    id: "unit-3",
    eyebrow: "Unit three",
    title: "TACIT: every instruction the SoC retired, on one timeline",
    status: "partial",
    note: "A trace encoder in the Rocket core writes retired instructions to memory; a decoder turns them into a timeline.",
    steps: [
      {
        id: "3.1",
        title: "Cache the trace viewer",
        where: "On your laptop · do this first",
        uplink: true,
        note: "Open it once, now, and let it finish loading.",
        blocks: [
          { kind: "url", text: "https://ui.perfetto.dev" },
          { kind: "out", text: "The Perfetto UI, with an Open trace file button in the left sidebar." },
        ],
        takeaway: "It runs in your browser afterwards, but the first load needs the internet. There is no offline copy in the room.",
        fixes: [
          { symptom: "The uplink is already down", action: "Borrow a neighbour's cached tab, or watch from the front." },
        ],
      },
    ],
    gaps: [
      "Capture has no attendee sequence: your card carries `0x5A5A0038`, TACIT needs `0x5A5A0039`, and the on-board decoder is not shipped. Shown from the front.",
    ],
  },
  {
    id: "unit-4",
    eyebrow: "Unit four",
    title: "Scheduling across the machine, and asking a model to write the kernel",
    status: "partial",
    uplink: true,
    note: "Three pieces at three stages of readiness. The scheduler is real and you run it.",
    steps: [
      {
        id: "4.1",
        title: "Solve a real schedule on your instance",
        where: "On the board",
        note: "XPU-RT places every operator onto the devices of a heterogeneous machine. Eight dispatches, provably optimal in under a second.",
        blocks: [
          {
            kind: "cmd",
            text: "/opt/iiswc/host/aws_ssh.sh -- 'source /etc/profile.d/xpurt.sh && \\\n    cd $XPURT_ROOT && XPURT_CPSAT_WORKERS=1 $XPURT_PYTHON \\\n    scripts/run_xpurt_schedule.py \\\n      --networks-json data/toplevel/networks_b154_gate.json \\\n      --solver cpsat --profiled --cpsat-time-limit 60'",
          },
          {
            kind: "out",
            text: "makespan_us=237.87  op_deadline_miss=0 (dispatches, NOT instances)  cross_dev=0  solver_s=0.377",
          },
        ],
        takeaway: "237.87 is measured on this silicon, so four vCPUs and a 48-core workstation return the same figure.",
        fixes: [
          { symptom: "`RuntimeError: no interpreter with ortools found`", action: "You dropped the `source`. It is not decoration." },
          { symptom: "Two runs, two different makespans", action: "`XPURT_CPSAT_WORKERS=1` is not set." },
          { symptom: "Nothing in the log for minutes", action: "Normal: Python buffers to the file. Check CPU time; `ps -C python3` matches nothing." },
        ],
      },
    ],
    gaps: [
      "Agentic code generation has no attendee flow; the fusion-hint speed-up was withdrawn by its own authors.",
      "RiskyBird is a look, not a lab — one or two boards in the room, shown from the front.",
    ],
  },
];

export const instructions = {
  eyebrow: "IISWC 2026 · Attendee bench card",
  title: "Four units, one board, one terminal",
  intro: "Work down the page. Each step is a command, the output you should get, and what to do when you don't.",
  offlineNote:
    "Served from the tutorial router at 10.42.0.1. No external fonts, scripts or styles, so it needs the router and nothing else.",
  seat: {
    label: "Your seat number",
    help: "Take it from the OLED: the last octet of 10.42.0.N. The glass is the authority, not a printed list.",
    derived: [
      { key: "Your board", value: "10.42.0.{N}" },
      { key: "Its hostname", value: "pynq-{N}" },
      { key: "Your instance", value: "aws-{N}.iiswc" },
    ],
  },
  provenance:
    "Every command here was run on 2026-09-23 on bench card pynq-2; the outputs are quoted from those runs.",
  secretsNote:
    "No secrets are on this page. The WiFi passphrase, the board password and the shared SSH key are handed out in the room.",
  units,
} as const;
