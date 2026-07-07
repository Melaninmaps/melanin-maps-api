{pkgs}: {
  deps = [
    pkgs.jdk
    pkgs.fontconfig
    pkgs.freetype
    pkgs.gcc-unwrapped
    pkgs.nss
    pkgs.xorg.libXrender
    pkgs.xorg.libXfixes
    pkgs.xorg.libXext
    pkgs.xorg.libXi
    pkgs.xorg.libXdamage
    pkgs.xorg.libXcursor
    pkgs.xorg.libXcomposite
    pkgs.xorg.libXrandr
    pkgs.xorg.libX11
    pkgs.xorg.libxcb
    pkgs.dbus
    pkgs.alsa-lib
    pkgs.gdk-pixbuf
    pkgs.cairo
    pkgs.atk
    pkgs.pango
    pkgs.gtk3
    pkgs.glib
  ];
}
