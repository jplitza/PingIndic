/* extension.js
 * Xynium sept 2022
 */

'use strict';

const { Atk, Gio, GObject, Clutter, GLib, St } = imports.gi;
const Main = imports.ui.main;
//const Mainloop = imports.mainloop;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Gettext = imports.gettext.domain('PingIndic');
const _ = Gettext.gettext;

const UPDTEDLY="update-interval";
const ADRESS='adress';
const LIMITFORGOOD = "limitforgood";
const LIMITFORBAD="limitforbad";

let mpingindic;

const Extension = GObject.registerClass(
class Extension extends PanelMenu.Button{
     _init () {
        super._init(0);

        this.accessible_role = Atk.Role.TOGGLE_BUTTON;

        this._settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.pingindic');
        this._settings.connect(`changed`, this.loadData.bind(this));

       // Label  voir les style at https://docs.gtk.org/Pango/pango_markup.html
        this.label = new St.Label({style_class: 'pingindic-label',y_align: Clutter.ActorAlign.CENTER,text: _("HOLA!!!")});
        //let topBox = new St.BoxLayout();
        //topBox.add_actor(label);
        //this.add_actor(topBox);
        this.add_actor(this.label);

        this.connect('button-press-event', () => { ExtensionUtils.openPrefs(); });
        this.connect('touch-event', () => { ExtensionUtils.openPrefs(); });

        this.loadData();
    }

    killChild() {
        if (this.IOchannelOUT) {
            this.IOchannelOUT.shutdown(false);
            this.IOchannelOUT = null;
        }
        if (this.IOchannelERR) {
            this.IOchannelERR.shutdown(false);
            this.IOchannelERR = null;
        }
        if (this.child_pid != null) {
            console.log("Killing ping PID " + this.child_pid);
            GLib.spawn_close_pid(this.child_pid);
            this.child_pid = null;
        }
    }

    loadData() {
        let success;
        this.killChild();
        this.command = [
            "fping",
            "-l", "-q",
            "-i", String(this._settings.get_int(UPDTEDLY)*1000),
            this._settings.get_string(ADRESS),
        ];
        [success, this.child_pid, this.std_in, this.std_out, this.std_err] = GLib.spawn_async_with_pipes(
            null,
            this.command,
            null,
            GLib.SpawnFlags.SEARCH_PATH,
            null);

        if (!success) {
            log('launching fping fail');
            return;
        }

        this.IOchannelOUT = GLib.IOChannel.unix_new(this.std_out);
        this.IOchannelERR = GLib.IOChannel.unix_new(this.std_err);

        GLib.io_add_watch(this.IOchannelOUT, GLib.PRIORITY_DEFAULT,
            GLib.IOCondition.IN | GLib.IOCondition.HUP, this.loadPipeOUT.bind(this) );

        GLib.io_add_watch(this.IOchannelERR, GLib.PRIORITY_DEFAULT,
            GLib.IOCondition.IN | GLib.IOCondition.HUP, this.loadPipeERR.bind(this) );
    }

     loadPipeOUT(channel, condition, data) {
        if (condition == GLib.IOCondition.HUP) {
            console.log("fping command exited, restarting");
            this.loadData();
        } else {
            let out = channel.read_line();
            switch (out[0]) {
                case GLib.IOStatus.EOF:
                    this.loadData();
                    break;
                case GLib.IOStatus.NORMAL:
                    const result =  out[1].split(/[,(]/);
                    if(result[1].trim() == "timed out") {
                        this.label.set_text("timeout");
                        this.label.set_style_class_name('pingindic-label-bad');
                    } else {
                        this.label.set_text(result[2]);
                        this.label.set_style_class_name(this.getlabelstyle(result[2]));
                    }
                    break;
            }
        }
        return GLib.SOURCE_CONTINUE;
    }

    loadPipeERR(channel, condition, data) {
        if (condition == GLib.IOCondition.HUP) {
            console.log("ping command exited, restarting");
            this.loadData();
        } else {
            let out = channel.read_line();
            switch (out[0]) {
                case GLib.IOStatus.EOF:
                    this.loadData();
                    break;
                case GLib.IOStatus.NORMAL:
                    console.log(out[1]);
                    this.label.set_text(_("err"));
                    this.label.set_style_class_name('pingindic-label-bad' );
                    break;
            }
        }
    }

    getlabelstyle(str) {
        let time = parseFloat(str);
        if (time<this._settings.get_int(LIMITFORGOOD))
            return 'pingindic-label-good';
        else {
            if (time<this._settings.get_int(LIMITFORBAD))
                return 'pingindic-label-nogood';
            else
                return 'pingindic-label-bad';
        }
    }
});

function enable() {
    mpingindic = new Extension();
    Main.panel.addToStatusArea('mpingindic', mpingindic, 0, 'right');
}

function disable() {
    mpingindic.killChild();
    mpingindic.destroy();
    mpingindic=null;
}

