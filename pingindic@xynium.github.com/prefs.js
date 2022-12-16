/*
 * PingIndic by Xynium September 2022
 */
'use strict';
const {  Gio, Gtk ,GObject} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Gettext = imports.gettext.domain('moonphases');
const _ = Gettext.gettext;

const UPDTEDLY="update-interval";
const ADRESS='adress';
const DIGITS='digits';
const LIMITFORGOOD = "limitforgood";
const LIMITFORBAD="limitforbad";

function init() {
    ExtensionUtils.initTranslations('moonphases');
}

function buildPrefsWidget () {
    let settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.pingindic');
    let builder = new Gtk.Builder();
    builder.set_translation_domain('PingIndic');
    builder.add_from_file(Me.path + '/prefs.ui');

    // update interval
    settings.bind(
        UPDTEDLY,
        builder.get_object("spbtnDly"),
        'value',
        Gio.SettingsBindFlags.DEFAULT,
    );

    // Adress
    settings.bind(
        ADRESS,
        builder.get_object('eAdress'),
        'text',
        Gio.SettingsBindFlags.DEFAULT,
    );

    // digits
    settings.bind(
        DIGITS,
        builder.get_object(DIGITS),
        'value',
        Gio.SettingsBindFlags.DEFAULT,
    );

    // indic style good
    settings.bind(
        LIMITFORGOOD,
        builder.get_object('spIndicGood'),
        'value',
        Gio.SettingsBindFlags.DEFAULT,
    );

     // indic style bad
    settings.bind(
        LIMITFORBAD,
        builder.get_object('spIndicBad'),
        'value',
        Gio.SettingsBindFlags.DEFAULT,
    );

    return builder.get_object('prefs-container') ;
}
