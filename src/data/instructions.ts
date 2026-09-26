/**
 * Attendee lab instructions.
 *
 * Every command and every quoted output below was executed on 2026-09-23 on bench
 * card pynq-2 at 10.42.0.2. The explanation belongs in the slides, not on this page:
 * keep each entry to the command, one line of orientation, and what the screen should
 * say.
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
        note: "`up M:SS` counts from the SoC's last boot and must be ticking. A frozen counter means the SoC has stopped.",
        blocks: [
          { kind: "out", text: "10.42.0.{N}\niiswc-robotics-tutorial\nup 4:17" },
        ],
        fixes: [
          { symptom: "`up M:SS` is frozen", action: "Power-cycle. The counter should restart at `up 0:00`." },
          { symptom: "`NO ADDRESS`, or `wlan0 DOWN`", action: "Power-cycle. Nothing below works until the board has an address." },
          { symptom: "Blank, and under two minutes", action: "Wait. Bringing up the network takes about 37 s." },
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
          { symptom: "`Permission denied (publickey,password)`", action: "`chmod 600` the key, then try the password instead." },
          { symptom: "`No route to host`, or it hangs", action: "Wrong network or wrong seat. Re-read the OLED." },
        ],
      },
      {
        id: "0.3",
        title: "Ask the board who it is",
        where: "On the board",
        note: "The same fields as the OLED, read from Linux. If the two disagree, trust this one.",
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
          { symptom: "`MAGIC  -`", action: "Harmless: reading the number needs privilege. Re-run under `sudo` to see it." },
          { symptom: "`MAGIC 0x5A5A0039`", action: "That is the trace bitstream. Units 1 and 2 need `0x5A5A0038`: reload the PL, no re-image." },
        ],
      },
      {
        id: "0.4",
        title: "Find your AWS instance",
        where: "On the board",
        uplink: true,
        note: "The board works out its seat from its own address, so you never type an IP.",
        blocks: [
          { kind: "cmd", text: "/opt/iiswc/host/aws_whoami.sh" },
          { kind: "out", text: "this board is 10.42.0.{N}, so it is seat {N}\nseat {N}  aws-{N}.iiswc -> 54.x.x.x" },
          { kind: "cmd", text: "/opt/iiswc/host/aws_whoami.sh --check" },
          { kind: "out", text: "tcp/22 open  SSH-2.0-OpenSSH_9.6p1 Ubuntu-3ubuntu13.14" },
        ],
        takeaway: "`--check` logs nobody in. It checks that egress works and that sshd is listening.",
        fixes: [
          { symptom: "`aws-{N}.iiswc did not resolve`", action: "Only the router at 10.42.0.1 serves `.iiswc` names, so this affects the whole room. Tell an instructor." },
          { symptom: "Resolves, but `--check` times out", action: "The instance is down or the name list is stale. An instructor republishes it." },
        ],
      },
      {
        id: "0.5",
        title: "The commands every unit uses",
        where: "On the board · reference",
        note: "All of them live in `/opt/iiswc/host/`.",
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
          { symptom: "`no private key at .../iiswc-2026-tutorial.pem`", action: "Ask an instructor to put it back." },
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
    note: "Your card has no toolchain. Build the image on the instance, then load it on the board.",
    steps: [
      {
        id: "1.1",
        title: "Open a shell on your instance",
        where: "On the board",
        note: "With no argument it asks `aws_whoami.sh` which instance is yours. The missing host-key warning is expected.",
        blocks: [
          { kind: "cmd", text: "/opt/iiswc/host/aws_ssh.sh" },
          { kind: "out", text: "Welcome to Ubuntu 24.04 LTS ...\nubuntu@ip-192-168-0-205:~$" },
        ],
        fixes: [
          { symptom: "Anything about the seat or the name", action: "That is step 0.4, not this one." },
          { symptom: "It drops after a few idle minutes", action: "Reconnect. The build runs on the instance, not in your session." },
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
        takeaway: "Build for `chipyard_pynqz1_all_f40`, never plain `chipyard_pynqz1`. The plain board has a different clock and the guest will not boot.",
        fixes: [
          { symptom: "`west: command not found`", action: "`source /home/ubuntu/tut/env.sh`" },
          { symptom: "CMake names a missing toolchain file", action: "The message is misleading: `ZEPHYR_SDK_INSTALL_DIR` points at another SDK." },
          { symptom: "CMake cannot find a source under `samples/`", action: "The instance image is behind. Tell an instructor." },
        ],
      },
      {
        id: "1.3",
        title: "Put it where the board will look",
        where: "On the instance",
        note: "Nothing in the repository creates `~/pub/`, so make it yourself and copy the image in.",
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
        note: "Log out of the instance first. One command pulls the image, loads the PL, starts the guest and reads the console.",
        blocks: [
          { kind: "cmd", text: "/opt/iiswc/host/aws_run.sh aws-{N}.iiswc" },
          {
            kind: "out",
            text: "==> 1/4  pull pub/zephyr.bin from aws-{N}.iiswc\n    pulled pub/zephyr.bin  (55536 bytes, 1.612 s)\n==> 2/4  check nobody else is reading the console\n==> 3/4  load the PL and start the guest\n==> 4/4  console\n    *** Booting Zephyr OS build 4329bf61c4fe ***\n    BI_STATUS state=PRESENT nonce=0x649bce5f soc_magic=0x5A5A0038\n    BI_NET host=pynq-{N} ipv4=10.42.0.{N} link_up=1\n    2156 bytes of console in /home/xilinx/tutorial/console.out",
          },
        ],
        takeaway: "The two nonces must match: DRAM is not cleared between loads. The OLED restarts at `up 0:00`.",
        fixes: [
          { symptom: "`[fail] 0 console bytes`", action: "Stop and tell an instructor. Do not retry and do not reboot." },
          { symptom: "The console is garbage characters", action: "The guest was built for the wrong board, so the clock is wrong. Rebuild for `chipyard_pynqz1_all_f40`." },
          { symptom: "`another console reader is already on /dev/ttyPS1`", action: "Kill the PID it prints, not a name pattern." },
          { symptom: "Banner only, no `BI_` lines", action: "The reader started late. The full text is in `/home/xilinx/tutorial/console.out`." },
        ],
      },
    ],
    gaps: [
      "This has run twice on the bench board and not yet on a card from the imaging flow, so zero console bytes may be the card rather than your build.",
    ],
  },
  {
    id: "unit-2",
    eyebrow: "Unit two",
    title: "ModelBlaster: a network compiled to kernels you can beat",
    status: "draft",
    note: "Compile a PyTorch model to int8 kernels for this SoC, replace one, and check that the replacement is identical rather than merely faster.",
    steps: [
      {
        id: "2.1",
        title: "Optional: the kernel gate",
        where: "On any clone of the repository, with gcc",
        note: "No board, no lock, no cross-compiler. It takes no arguments and exits with the number of failures.",
        blocks: [
          { kind: "cmd", text: "fpga/pynq-z2/modelblaster/kernels/pext_nl/test/b76_gate.sh" },
        ],
      },
    ],
    gaps: [
      "No attendee sequence yet. Every ModelBlaster lab needs the bench-board lock, an 18 GB toolchain and a repository checkout, and your card carries none of them.",
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
        takeaway: "The first load needs the internet; after that it runs in your browser. There is no offline copy in the room.",
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
    note: "Three pieces. You run the scheduler; the other two are shown from the front.",
    steps: [
      {
        id: "4.1",
        title: "Solve a real schedule on your instance",
        where: "On the board",
        note: "XPU-RT places every operator of a network onto the devices of a heterogeneous machine. Eight dispatches, solved to optimality in under a second.",
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
        takeaway: "The operator durations are measured on this silicon, so four vCPUs and a 48-core workstation both return 237.87.",
        fixes: [
          { symptom: "`RuntimeError: no interpreter with ortools found`", action: "Re-run with the `source` line included." },
          { symptom: "Two runs, two different makespans", action: "`XPURT_CPSAT_WORKERS=1` is not set." },
          { symptom: "Nothing in the log for minutes", action: "Normal: Python buffers to the file. Check CPU time; `ps -C python3` matches nothing." },
        ],
      },
    ],
    gaps: [
      "Agentic code generation has no attendee flow; the fusion-hint speed-up was withdrawn by its own authors.",
      "RiskyBird is a demonstration rather than a lab: one or two boards in the room, shown from the front.",
    ],
  },
];

export const instructions = {
  eyebrow: "IISWC 2026 · Attendee bench card",
  title: "Four units, one board, one terminal",
  intro: "Work down the page. Each step is a command, the output you should get, and what to do when you don't.",
  offlineNote:
    "Served from the tutorial router at 10.42.0.1, with no external fonts, scripts or styles.",
  seat: {
    label: "Your seat number",
    help: "Take it from the OLED: the last octet of 10.42.0.N.",
    derived: [
      { key: "Your board", value: "10.42.0.{N}" },
      { key: "Its hostname", value: "pynq-{N}" },
      { key: "Your instance", value: "aws-{N}.iiswc" },
    ],
  },
  provenance:
    "Every command here was run on 2026-09-23 on bench card pynq-2; the outputs are quoted from those runs.",
  secretsNote:
    "The WiFi passphrase, the board password and the shared SSH key are handed out in the room.",
  units,
} as const;
