/**
 * Attendee lab instructions.
 *
 * The attendee works in JupyterLab on their own instance: `lab.sh()` runs a command
 * there, and `lab.board()` sends one verb to their card. Keep each entry to the command,
 * one line of orientation, and what the screen should say, because the explanation
 * belongs in the slides.
 *
 * Provenance for the quoted output is in `instructions.provenance`. The notebook an
 * attendee opens is generated from this file by `notebooks/tools/build_notebook.py` in
 * the tutorial repository, so a content change belongs here first and the two read as
 * one voice.
 *
 * "{N}" is the seat placeholder. It is rewritten everywhere by the seat box.
 */

export const SEAT_TOKEN = "{N}";

/** Replace the seat placeholder; an empty seat keeps the literal "N". */
export const fillSeat = (text: string, seat: string): string =>
  text.replaceAll(SEAT_TOKEN, seat.length > 0 ? seat : "N");

/**
 * How an attendee learns the address of their own seat.
 *
 * This is the one step with no self-service answer yet, so the page says what is true
 * today and nothing more. When a mechanism lands — the board showing its instance's
 * address is being written and is not confirmed working — this string is the only text
 * on the page that has to change.
 */
export const seatAddress = "An instructor gives you the address of your seat.";

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
  steps?: Step[];
  gaps?: string[];
}

export const statusLabels: Record<UnitStatus, string> = {
  live: "Runs today",
  partial: "Part runs today",
  draft: "No attendee steps yet",
};

const units: Unit[] = [
  {
    id: "unit-0",
    eyebrow: "Start here",
    title: "Open your seat, and check your board",
    status: "live",
    note: "Five short steps. Every unit after this assumes them.",
    steps: [
      {
        id: "0.1",
        title: "Power on your board",
        where: "At the board · nothing to type",
        note: "Switch the card on and leave it alone; it joins the room network by itself. `up M:SS` on the OLED counts from the SoC's last boot and must be ticking.",
        blocks: [
          { kind: "out", text: "10.42.0.{N}\niiswc-robotics-tutorial\nup 4:17" },
        ],
        fixes: [
          { symptom: "`up M:SS` is frozen", action: "Power-cycle. The counter should restart at `up 0:00`." },
          { symptom: "`NO ADDRESS`, or `wlan0 DOWN`", action: "Power-cycle. Without an address the card cannot reach your instance." },
          { symptom: "Blank, and under two minutes", action: "Wait. Bringing up the network takes about 37 s." },
        ],
      },
      {
        id: "0.2",
        title: "Open your seat in a browser",
        where: "On your laptop",
        note: `${seatAddress} Open \`https://<that address>/\` over whatever internet you already have, and log in with the passphrase an instructor reads out. You do not need the room network.`,
        blocks: [
          { kind: "out", text: "JupyterLab, with an amber band across the top panel:\nSEAT {N} · <your seat's address>" },
        ],
        takeaway: "Check the band before you start work: the same passphrase opens every seat, so a mistyped address drops you into a neighbour's work with no warning.",
        fixes: [
          { symptom: "Nothing loads at all", action: "Type the `https://` yourself." },
          { symptom: "`502 Bad Gateway`", action: "The instance is still starting. Wait half a minute and reload." },
          { symptom: "`429 Too many requests`", action: "Too many login attempts from the room at once. Wait a minute and try again." },
          { symptom: "The band names a seat that is not yours", action: "Log out, re-read the address, and open it again." },
        ],
      },
      {
        id: "0.3",
        title: "Open the notebook",
        where: "In JupyterLab",
        note: "`iiswc_tutorial.ipynb` is in the file browser already, with `iiswc_lab.py` and the `assets/` it reads. Open it and run the first cell; it imports the helpers and prints which instance you are on.",
        blocks: [
          { kind: "cmd", text: "import sys, pathlib\nsys.path.insert(0, str(pathlib.Path.cwd()))\nimport iiswc_lab as lab\n\nlab.where_am_i()" },
        ],
        takeaway: "The kernel runs on the instance, so a long cell survives a dropped browser. Reconnect and its output is still there.",
        fixes: [
          { symptom: "`ModuleNotFoundError: iiswc_lab`", action: "Run the whole cell: its first two lines put the working directory on the path." },
        ],
      },
      {
        id: "0.4",
        title: "Check your board is connected",
        where: "In the notebook",
        note: "Your card connects to this instance by itself. This cell reports whether it has, in about three seconds; re-run it whenever the card stops answering. `MAGIC -` is a card that has done no privileged read, which is not an error.",
        blocks: [
          { kind: "cmd", text: "lab.board_status()" },
          { kind: "out", text: "board connected -- pynq-{N}, 10.42.0.{N}, PL operating, MAGIC -" },
        ],
        fixes: [
          { symptom: "`board offline (nothing is listening)`", action: "The card has not connected yet. Read the OLED again, and power-cycle if `up M:SS` is frozen." },
          { symptom: "`board offline (tunnel is stale)`", action: "The card retries on its own. Wait, then re-run the cell." },
          { symptom: "It stays offline after a power-cycle", action: "Tell an instructor. Every step below that runs on the instance runs without a board." },
          { symptom: "`PL` is anything but `operating`", action: "Power-cycle and let the boot service load the bitstream." },
          { symptom: "`MAGIC 0x5A5A0039`", action: "That is the trace bitstream. Unit 1 needs `0x5A5A0038`: load the PL again, no re-image." },
        ],
      },
      {
        id: "0.5",
        title: "The verbs your card accepts",
        where: "In the notebook · reference",
        note: "`lab.board()` sends one of these ten and nothing else; `lab.sh()` runs a command on the instance. Every step below says which it uses.",
        reference: [
          { command: "ping, status", does: "Is it there, and who is it." },
          { command: "help, ls", does: "What it accepts, and what results it holds." },
          { command: "put, get", does: "A file to the card, a result back." },
          { command: "bitstream", does: "Load a PL variant." },
          { command: "run", does: "One named lab step." },
          { command: "camera, mic", does: "One capture, where the hardware is fitted." },
        ],
      },
    ],
  },
  {
    id: "unit-1",
    eyebrow: "Unit one",
    title: "Zephyr and Chipyard: build an image on the instance, run it on your SoC",
    status: "live",
    note: "Your card has no toolchain. Build the image on the instance, send it to the card, and start the guest from the notebook.",
    steps: [
      {
        id: "1.1",
        title: "Open a shell on your instance",
        where: "In the notebook",
        note: "You have one already: `lab.sh(\"...\")` runs a command on the instance and streams it back into the cell.",
      },
      {
        id: "1.2",
        title: "Build a Zephyr image for the Rocket SoC",
        where: "On the instance",
        note: "Ten to twenty-five seconds. `samples/boot_info` is the guest your board is running now.",
        blocks: [
          {
            kind: "cmd",
            text: "lab.sh(\"\"\"cd /home/ubuntu/tut && source /home/ubuntu/tut/env.sh && \\\nwest build -p always -b chipyard_pynqz1_all_f40 \\\n    -d ~/out/boot_info samples/boot_info \\\n    -- -DBOARD_ROOT=/home/ubuntu/tut\"\"\", timeout=900)",
          },
          {
            kind: "out",
            text: "-- west build: building application\n...\nMemory region         Used Size  Region Size  %age Used\n             RAM:       69720 B       256 MB      0.03%",
          },
          { kind: "cmd", text: "lab.sh(\"ls -l ~/out/boot_info/zephyr/zephyr.bin\")" },
          { kind: "out", text: "-rw-rw-r-- 1 ubuntu ubuntu 56888 ... zephyr.bin" },
        ],
      },
      {
        id: "1.4",
        title: "Upload the image to the PYNQ board and run it",
        where: "On the board",
        note: "Three cells, about forty seconds in all: the image you just built goes to the card, the card loads the PL and starts the guest, and the console comes back as a file. The md5 is the card's own, so a truncated transfer shows up here rather than as a dead guest.",
        blocks: [
          { kind: "cmd", text: "lab.board_put(\"/home/ubuntu/out/boot_info/zephyr/zephyr.bin\")" },
          { kind: "out", text: "{\"ok\": true, \"stored\": \"zephyr.bin\", \"bytes\": 56888,\n \"md5\": \"c830b4b6a0d1e4f7c2b9358e6a1d70cf\"}" },
          { kind: "cmd", text: "lab.board(\"run\", \"zephyr\", timeout=300)" },
          { kind: "out", text: "{\n  \"ok\": true,\n  \"ran\": \"zephyr\",\n  \"console_bytes\": 373,\n  \"results\": [\"console.out\", \"run.log\"]\n}" },
          {
            kind: "cmd",
            text: "c = lab.board(\"get\", \"console.out\", binary=True, verbose=False)\nprint(c.stdout.decode(\"utf-8\", \"replace\") if c.ok else c)",
          },
          {
            kind: "out",
            text: "*** Booting Zephyr OS build 4329bf61c4fe ***\nBI_STATUS state=PRESENT nonce=0xa1873611 soc_magic=0x5A5A0038\nBI_NET host=pynq-{N} ipv4=10.42.0.{N} ssid=iiswc-robotics-tutorial link_up=1\nBI_DONE",
          },
        ],
        takeaway: "`soc_magic=0x5A5A0038` is the bitstream Unit 1 wants. The nonce is yours and will differ, and the OLED restarts at `up 0:00`.",
        fixes: [
          { symptom: "`console_bytes: 0`", action: "Stop and tell an instructor. Do not retry and do not reboot." },
          
          { symptom: "`another console reader is already on /dev/ttyPS1`", action: "Kill the PID it prints, not a name pattern." },
          { symptom: "Banner only, no `BI_` lines", action: "The reader started late. The whole text is in `console.out` on the card." },
        ],
      },
    ],
    gaps: [
      "This has run end to end on one card and one instance. Thirty at once is untested, as is what happens when a card drops its connection in the middle of a cell.",
    ],
  },
  {
    id: "unit-2",
    eyebrow: "Unit two",
    title: "ModelBlaster: Compiling PyTorch Models to embedded Heterogeneous SoCs",
    status: "partial",
    note: "Compile a PyTorch model to int8 kernels for this SoC, replace one, and check that the replacement is identical rather than merely faster. The gate below is how a replacement is accepted: it compares every candidate against the shipping kernel over every shape and scale the decoder dispatches.",
    steps: [
      {
        id: "2.1",
        title: "Optional: run the kernel gate",
        where: "On the instance",
        note: "It takes no arguments, exits with the number of failures, and runs for about three minutes, which is why it is optional.",
        blocks: [
          { kind: "cmd", text: "lab.sh(\"cd /home/ubuntu/tut && fpga/pynq-z2/modelblaster/kernels/pext_nl/test/b76_gate.sh\",\n       timeout=600)" },
          { kind: "out", text: "b76 permute gate: ... fails=0  PASS\n...\nB76 GATE PASSED" },
        ],
        takeaway: "It prints 26 `FAIL` and 260 `MISMATCH` lines on a passing run, each one a poisoned route the gate has to reject, so read the four gate lines and the verdict rather than the scroll.",
      },
    ],
    gaps: [
      "Generating the kernels has no attendee sequence yet. Unit 4 is an LLM writing one of those replacement kernels.",
    ],
  },
  {
    id: "unit-3",
    eyebrow: "Unit three",
    title: "TACIT: instruction-level tracing of two heterogeneous harts on one timeline",
    status: "partial",
    note: "A trace encoder in the Rocket core writes retired instructions to memory; a decoder turns them into a timeline.",
    steps: [
      {
        id: "3.1",
        title: "Cache the trace viewer",
        where: "On your laptop · do this first",
        note: "Open it once now and let it finish loading; after the first load it runs in your browser.",
        blocks: [
          { kind: "url", text: "https://ui.perfetto.dev" },
          { kind: "out", text: "The Perfetto UI, with an Open trace file button in the left sidebar." },
        ],
      },
    ],
    gaps: [
      "Capture has no attendee sequence: your card carries `0x5A5A0038`, TACIT needs `0x5A5A0039`, and the on-board decoder is not shipped. Capture is shown from the front.",
    ],
  },
  {
    id: "unit-4",
    eyebrow: "Unit four",
    title: "Agentic Optimization in ModelBlaster",
    status: "partial",
    note: "An LLM rewrites one int8 kernel for the board's MBP instructions, Spike scores every candidate bit-exact against the reference, and the board then runs the round's best kernel three ways — the reference, the new kernel, and the new kernel with MBP switched off — so the accelerator is priced apart from the rewritten loop. This unit is its own pair of notebooks on your seat, and `mb_lab_solved.ipynb` redraws a complete run from the recorded runs shipped beside it: the LLM's rounds, the kernels it wrote, the conversation it had, and the verdict.",
    gaps: [
      "Running the lab live, on your own board and LLM key, is not ready yet.",
    ],
  },
  {
    id: "unit-5",
    eyebrow: "Unit five",
    title: "XPU-RT: Scheduling Multi-Model Workloads to Heterogeneous SoCs",
    status: "partial",
    note: "You run the scheduler.",
    steps: [
      {
        id: "5.1",
        title: "Solve a real schedule on your instance",
        where: "On the instance",
        note: "XPU-RT places every operator of a network onto the devices of a heterogeneous machine. Eight dispatches, solved to optimality in under a second.",
        blocks: [
          {
            kind: "cmd",
            text: "lab.sh(\"\"\"source /etc/profile.d/xpurt.sh && cd $XPURT_ROOT && \\\nXPURT_CPSAT_WORKERS=1 $XPURT_PYTHON scripts/run_xpurt_schedule.py \\\n  --networks-json data/toplevel/networks_b154_gate.json \\\n  --solver cpsat --profiled --cpsat-time-limit 60\"\"\", timeout=300)",
          },
          {
            kind: "out",
            text: "makespan_us=237.87  op_deadline_miss=0 (dispatches, NOT instances)  cross_dev=0  solver_s=0.377",
          },
        ],
        takeaway: "The operator durations are measured on this silicon, so four vCPUs and a 48-core workstation both return 237.87. `solver_s` is your instance's own wall clock and will differ.",
        fixes: [
          { symptom: "Nothing in the output for a minute", action: "Normal: Python buffers. The solve is under three seconds once it starts." },
        ],
      },
    ],
    gaps: [
      "RiskyBird, the robot these schedules are for, is a demonstration rather than a lab: one or two boards in the room, shown from the front.",
    ],
  },
];

export const instructions = {
  eyebrow: "IISWC 2026 · Attendee bench card",
  title: "Five units, in the order you run them",
  intro: "Work down the page. Each step is a command, the output you should get, and what to do when you don't.",
  seat: {
    label: "Your seat number",
    help: "Take it from the OLED: the last octet of 10.42.0.N. JupyterLab repeats it in the band across the top.",
    derived: [
      { key: "Your board", value: "10.42.0.{N}" },
      { key: "Its hostname", value: "pynq-{N}" },
      { key: "The band in JupyterLab", value: "SEAT {N}" },
    ],
  },
  provenance:
    "Quoted from two runs: a tutorial instance with card pynq-13 on 2026-09-24, and bench card pynq-2 on 2026-09-23. Your seat number stands in for the card's.",
  secretsNote:
    "The passphrase is handed out in the room, and it is the same one for every seat.",
  units,
} as const;
