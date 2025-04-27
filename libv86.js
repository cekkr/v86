
// ---- File: lib/filesystem.js ----
// -------------------------------------------------
// ----------------- FILESYSTEM---------------------
// -------------------------------------------------
// Implementation of a unix filesystem in memory.









// For Types Only


const S_IRWXUGO = 0x1FF;
const S_IFMT = 0xF000;
const S_IFSOCK = 0xC000;
const S_IFLNK = 0xA000;
const S_IFREG = 0x8000;
const S_IFBLK = 0x6000;
const S_IFDIR = 0x4000;
const S_IFCHR = 0x2000;

//var S_IFIFO  0010000
//var S_ISUID  0004000
//var S_ISGID  0002000
//var S_ISVTX  0001000

var O_RDONLY = 0x0000; // open for reading only
var O_WRONLY = 0x0001; // open for writing only
var O_RDWR = 0x0002; // open for reading and writing
var O_ACCMODE = 0x0003; // mask for above modes

const STATUS_INVALID = -0x1;
const STATUS_OK = 0x0;
const STATUS_ON_STORAGE = 0x2;
const STATUS_UNLINKED = 0x4;
const STATUS_FORWARDING = 0x5;

//const texten = new TextEncoder();

/** @const */ var JSONFS_VERSION = 3;


/** @const */ var JSONFS_IDX_NAME = 0;
/** @const */ var JSONFS_IDX_SIZE = 1;
/** @const */ var JSONFS_IDX_MTIME = 2;
/** @const */ var JSONFS_IDX_MODE = 3;
/** @const */ var JSONFS_IDX_UID = 4;
/** @const */ var JSONFS_IDX_GID = 5;
/** @const */ var JSONFS_IDX_TARGET = 6;
/** @const */ var JSONFS_IDX_SHA256 = 6;


/**
 * @constructor
 * @param {!FileStorageInterface} storage
 * @param {{ last_qidnumber: number }=} qidcounter Another fs's qidcounter to synchronise with.
 */
function FS(storage, qidcounter) {
    /** @type {Array.<!Inode>} */
    this.inodes = [];
    this.events = [];

    this.storage = storage;

    this.qidcounter = qidcounter || { last_qidnumber: 0 };

    //this.tar = new TAR(this);

    this.inodedata = {};

    this.total_size = 256 * 1024 * 1024 * 1024;
    this.used_size = 0;

    /** @type {!Array<!FSMountInfo>} */
    this.mounts = [];

    //RegisterMessage("LoadFilesystem", this.LoadFilesystem.bind(this) );
    //RegisterMessage("MergeFile", this.MergeFile.bind(this) );
    //RegisterMessage("tar",
    //    function(data) {
    //        SendToMaster("tar", this.tar.Pack(data));
    //    }.bind(this)
    //);
    //RegisterMessage("sync",
    //    function(data) {
    //        SendToMaster("sync", this.tar.Pack(data));
    //    }.bind(this)
    //);

    // root entry
    this.CreateDirectory("", -1);
}

FS.prototype.get_state = function()
{
    let state = [];

    state[0] = this.inodes;
    state[1] = this.qidcounter.last_qidnumber;
    state[2] = [];
    for(const [id, data] of Object.entries(this.inodedata))
    {
        if((this.inodes[id].mode & S_IFDIR) === 0)
        {
            state[2].push([id, data]);
        }
    }
    state[3] = this.total_size;
    state[4] = this.used_size;
    state = state.concat(this.mounts);

    return state;
};

FS.prototype.set_state = function(state)
{
    this.inodes = state[0].map(state => { const inode = new Inode(0); inode.set_state(state); return inode; });
    this.qidcounter.last_qidnumber = state[1];
    this.inodedata = {};
    for(let [key, value] of state[2])
    {
        if(value.buffer.byteLength !== value.byteLength)
        {
            // make a copy if we didn't get one
            value = value.slice();
        }

        this.inodedata[key] = value;
    }
    this.total_size = state[3];
    this.used_size = state[4];
    this.mounts = state.slice(5);
};


// -----------------------------------------------------

FS.prototype.AddEvent = function(id, OnEvent) {
    var inode = this.inodes[id];
    if(inode.status === STATUS_OK || inode.status === STATUS_ON_STORAGE) {
        OnEvent();
    }
    else if(this.is_forwarder(inode))
    {
        this.follow_fs(inode).AddEvent(inode.foreign_id, OnEvent);
    }
    else
    {
        this.events.push({id: id, OnEvent: OnEvent});
    }
};

FS.prototype.HandleEvent = function(id) {
    const inode = this.inodes[id];
    if(this.is_forwarder(inode))
    {
        this.follow_fs(inode).HandleEvent(inode.foreign_id);
    }
    //dbg_log("number of events: " + this.events.length, LOG_9P);
    var newevents = [];
    for(var i=0; i<this.events.length; i++) {
        if(this.events[i].id === id) {
            this.events[i].OnEvent();
        } else {
            newevents.push(this.events[i]);
        }
    }
    this.events = newevents;
};

FS.prototype.load_from_json = function(fs)
{
    dbg_assert(fs, "Invalid fs passed to load_from_json");

    if(fs["version"] !== JSONFS_VERSION)
    {
        throw "The filesystem JSON format has changed. " +
              "Please update your fs2json (https://github.com/copy/fs2json) and recreate the filesystem JSON.";
    }

    var fsroot = fs["fsroot"];
    this.used_size = fs["size"];

    for(var i = 0; i < fsroot.length; i++) {
        this.LoadRecursive(fsroot[i], 0);
    }

    //if(DEBUG)
    //{
    //    this.Check();
    //}
};

FS.prototype.LoadRecursive = function(data, parentid)
{
    var inode = this.CreateInode();

    const name = data[JSONFS_IDX_NAME];
    inode.size = data[JSONFS_IDX_SIZE];
    inode.mtime = data[JSONFS_IDX_MTIME];
    inode.ctime = inode.mtime;
    inode.atime = inode.mtime;
    inode.mode = data[JSONFS_IDX_MODE];
    inode.uid = data[JSONFS_IDX_UID];
    inode.gid = data[JSONFS_IDX_GID];

    var ifmt = inode.mode & S_IFMT;

    if(ifmt === S_IFDIR)
    {
        this.PushInode(inode, parentid, name);
        this.LoadDir(this.inodes.length - 1, data[JSONFS_IDX_TARGET]);
    }
    else if(ifmt === S_IFREG)
    {
        inode.status = STATUS_ON_STORAGE;
        inode.sha256sum = data[JSONFS_IDX_SHA256];
        dbg_assert(inode.sha256sum);
        this.PushInode(inode, parentid, name);
    }
    else if(ifmt === S_IFLNK)
    {
        inode.symlink = data[JSONFS_IDX_TARGET];
        this.PushInode(inode, parentid, name);
    }
    else if(ifmt === S_IFSOCK)
    {
        // socket: ignore
    }
    else
    {
        dbg_log("Unexpected ifmt: " + h(ifmt) + " (" + name + ")", LOG_9P);
    }
};

FS.prototype.LoadDir = function(parentid, children)
{
    for(var i = 0; i < children.length; i++) {
        this.LoadRecursive(children[i], parentid);
    }
};


// -----------------------------------------------------

/**
 * @private
 * @param {Inode} inode
 * @return {boolean}
 */
FS.prototype.should_be_linked = function(inode)
{
    // Note: Non-root forwarder inode could still have a non-forwarder parent, so don't use
    // parent inode to check.
    return !this.is_forwarder(inode) || inode.foreign_id === 0;
};

/**
 * @private
 * @param {number} parentid
 * @param {number} idx
 * @param {string} name
 */
FS.prototype.link_under_dir = function(parentid, idx, name)
{
    const inode = this.inodes[idx];
    const parent_inode = this.inodes[parentid];

    dbg_assert(!this.is_forwarder(parent_inode),
        "Filesystem: Shouldn't link under fowarder parents");
    dbg_assert(this.IsDirectory(parentid),
        "Filesystem: Can't link under non-directories");
    dbg_assert(this.should_be_linked(inode),
        "Filesystem: Can't link across filesystems apart from their root");
    dbg_assert(inode.nlinks >= 0,
        "Filesystem: Found negative nlinks value of " + inode.nlinks);
    dbg_assert(!parent_inode.direntries.has(name),
        "Filesystem: Name '" + name + "' is already taken");

    parent_inode.direntries.set(name, idx);
    inode.nlinks++;

    if(this.IsDirectory(idx))
    {
        dbg_assert(!inode.direntries.has(".."),
            "Filesystem: Cannot link a directory twice");

        if(!inode.direntries.has(".")) inode.nlinks++;
        inode.direntries.set(".", idx);

        inode.direntries.set("..", parentid);
        parent_inode.nlinks++;
    }
};

/**
 * @private
 * @param {number} parentid
 * @param {string} name
 */
FS.prototype.unlink_from_dir = function(parentid, name)
{
    const idx = this.Search(parentid, name);
    const inode = this.inodes[idx];
    const parent_inode = this.inodes[parentid];

    dbg_assert(!this.is_forwarder(parent_inode), "Filesystem: Can't unlink from forwarders");
    dbg_assert(this.IsDirectory(parentid), "Filesystem: Can't unlink from non-directories");

    const exists = parent_inode.direntries.delete(name);
    if(!exists)
    {
        dbg_assert(false, "Filesystem: Can't unlink non-existent file: " + name);
        return;
    }

    inode.nlinks--;

    if(this.IsDirectory(idx))
    {
        dbg_assert(inode.direntries.get("..") === parentid,
            "Filesystem: Found directory with bad parent id");

        inode.direntries.delete("..");
        parent_inode.nlinks--;
    }

    dbg_assert(inode.nlinks >= 0,
        "Filesystem: Found negative nlinks value of " + inode.nlinks);
};

FS.prototype.PushInode = function(inode, parentid, name) {
    if(parentid !== -1) {
        this.inodes.push(inode);
        inode.fid = this.inodes.length - 1;
        this.link_under_dir(parentid, inode.fid, name);
        return;
    } else {
        if(this.inodes.length === 0) { // if root directory
            this.inodes.push(inode);
            inode.direntries.set(".", 0);
            inode.direntries.set("..", 0);
            inode.nlinks = 2;
            return;
        }
    }

    dbg_assert(false, "Error in Filesystem: Pushed inode with name = "+ name + " has no parent");
};

/** @constructor */
function Inode(qidnumber)
{
    this.direntries = new Map(); // maps filename to inode id
    this.status = 0;
    this.size = 0x0;
    this.uid = 0x0;
    this.gid = 0x0;
    this.fid = 0;
    this.ctime = 0;
    this.atime = 0;
    this.mtime = 0;
    this.major = 0x0;
    this.minor = 0x0;
    this.symlink = "";
    this.mode = 0x01ED;
    this.qid = {
        type: 0,
        version: 0,
        path: qidnumber,
    };
    this.caps = undefined;
    this.nlinks = 0;
    this.sha256sum = "";

    /** @type{!Array<!FSLockRegion>} */
    this.locks = []; // lock regions applied to the file, sorted by starting offset.

    // For forwarders:
    this.mount_id = -1; // which fs in this.mounts does this inode forward to?
    this.foreign_id = -1; // which foreign inode id does it represent?

    //this.qid_type = 0;
    //this.qid_version = 0;
    //this.qid_path = qidnumber;
}

Inode.prototype.get_state = function()
{
    const state = [];
    state[0] = this.mode;

    if((this.mode & S_IFMT) === S_IFDIR)
    {
        state[1] = [...this.direntries];
    }
    else if((this.mode & S_IFMT) === S_IFREG)
    {
        state[1] = this.sha256sum;
    }
    else if((this.mode & S_IFMT) === S_IFLNK)
    {
        state[1] = this.symlink;
    }
    else if((this.mode & S_IFMT) === S_IFSOCK)
    {
        state[1] = [this.minor, this.major];
    }
    else
    {
        state[1] = null;
    }

    state[2] = this.locks;
    state[3] = this.status;
    state[4] = this.size;
    state[5] = this.uid;
    state[6] = this.gid;
    state[7] = this.fid;
    state[8] = this.ctime;
    state[9] = this.atime;
    state[10] = this.mtime;
    state[11] = this.qid.version;
    state[12] = this.qid.path;
    state[13] = this.nlinks;

    //state[23] = this.mount_id;
    //state[24] = this.foreign_id;
    //state[25] = this.caps; // currently not writable
    return state;
};

Inode.prototype.set_state = function(state)
{
    this.mode = state[0];

    if((this.mode & S_IFMT) === S_IFDIR)
    {
        this.direntries = new Map();
        for(const [name, entry] of state[1])
        {
            this.direntries.set(name, entry);
        }
    }
    else if((this.mode & S_IFMT) === S_IFREG)
    {
        this.sha256sum = state[1];
    }
    else if((this.mode & S_IFMT) === S_IFLNK)
    {
        this.symlink = state[1];
    }
    else if((this.mode & S_IFMT) === S_IFSOCK)
    {
        [this.minor, this.major] = state[1];
    }
    else
    {
        // Nothing
    }

    this.locks = [];
    for(const lock_state of state[2])
    {
        const lock = new FSLockRegion();
        lock.set_state(lock_state);
        this.locks.push(lock);
    }
    this.status = state[3];
    this.size = state[4];
    this.uid = state[5];
    this.gid = state[6];
    this.fid = state[7];
    this.ctime = state[8];
    this.atime = state[9];
    this.mtime = state[10];
    this.qid.type = (this.mode & S_IFMT) >> 8;
    this.qid.version = state[11];
    this.qid.path = state[12];
    this.nlinks = state[13];

    //this.mount_id = state[23];
    //this.foreign_id = state[24];
    //this.caps = state[20];
};

/**
 * Clones given inode to new idx, effectively diverting the inode to new idx value.
 * Hence, original idx value is now free to use without losing the original information.
 * @private
 * @param {number} parentid Parent of target to divert.
 * @param {string} filename Name of target to divert.
 * @return {number} New idx of diversion.
 */
FS.prototype.divert = function(parentid, filename)
{
    const old_idx = this.Search(parentid, filename);
    const old_inode = this.inodes[old_idx];
    const new_inode = new Inode(-1);

    dbg_assert(old_inode, "Filesystem divert: name (" + filename + ") not found");
    dbg_assert(this.IsDirectory(old_idx) || old_inode.nlinks <= 1,
        "Filesystem: can't divert hardlinked file '" + filename + "' with nlinks=" +
        old_inode.nlinks);

    // Shallow copy is alright.
    Object.assign(new_inode, old_inode);

    const idx = this.inodes.length;
    this.inodes.push(new_inode);
    new_inode.fid = idx;

    // Relink references
    if(this.is_forwarder(old_inode))
    {
        this.mounts[old_inode.mount_id].backtrack.set(old_inode.foreign_id, idx);
    }
    if(this.should_be_linked(old_inode))
    {
        this.unlink_from_dir(parentid, filename);
        this.link_under_dir(parentid, idx, filename);
    }

    // Update children
    if(this.IsDirectory(old_idx) && !this.is_forwarder(old_inode))
    {
        for(const [name, child_id] of new_inode.direntries)
        {
            if(name === "." || name === "..") continue;
            if(this.IsDirectory(child_id))
            {
                this.inodes[child_id].direntries.set("..", idx);
            }
        }
    }

    // Relocate local data if any.
    this.inodedata[idx] = this.inodedata[old_idx];
    delete this.inodedata[old_idx];

    // Retire old reference information.
    old_inode.direntries = new Map();
    old_inode.nlinks = 0;

    return idx;
};

/**
 * Copy all non-redundant info.
 * References left untouched: local idx value and links
 * @private
 * @param {!Inode} src_inode
 * @param {!Inode} dest_inode
 */
FS.prototype.copy_inode = function(src_inode, dest_inode)
{
    Object.assign(dest_inode, src_inode, {
        fid: dest_inode.fid,
        direntries: dest_inode.direntries,
        nlinks: dest_inode.nlinks,
    });
};

FS.prototype.CreateInode = function() {
    //console.log("CreateInode", Error().stack);
    const now = Math.round(Date.now() / 1000);
    const inode = new Inode(++this.qidcounter.last_qidnumber);
    inode.atime = inode.ctime = inode.mtime = now;
    return inode;
};


// Note: parentid = -1 for initial root directory.
FS.prototype.CreateDirectory = function(name, parentid) {
    const parent_inode = this.inodes[parentid];
    if(parentid >= 0 && this.is_forwarder(parent_inode))
    {
        const foreign_parentid = parent_inode.foreign_id;
        const foreign_id = this.follow_fs(parent_inode).CreateDirectory(name, foreign_parentid);
        return this.create_forwarder(parent_inode.mount_id, foreign_id);
    }
    var x = this.CreateInode();
    x.mode = 0x01FF | S_IFDIR;
    if(parentid >= 0) {
        x.uid = this.inodes[parentid].uid;
        x.gid = this.inodes[parentid].gid;
        x.mode = (this.inodes[parentid].mode & 0x1FF) | S_IFDIR;
    }
    x.qid.type = S_IFDIR >> 8;
    this.PushInode(x, parentid, name);
    this.NotifyListeners(this.inodes.length-1, "newdir");
    return this.inodes.length-1;
};

FS.prototype.CreateFile = function(filename, parentid) {
    const parent_inode = this.inodes[parentid];
    if(this.is_forwarder(parent_inode))
    {
        const foreign_parentid = parent_inode.foreign_id;
        const foreign_id = this.follow_fs(parent_inode).CreateFile(filename, foreign_parentid);
        return this.create_forwarder(parent_inode.mount_id, foreign_id);
    }
    var x = this.CreateInode();
    x.uid = this.inodes[parentid].uid;
    x.gid = this.inodes[parentid].gid;
    x.qid.type = S_IFREG >> 8;
    x.mode = (this.inodes[parentid].mode & 0x1B6) | S_IFREG;
    this.PushInode(x, parentid, filename);
    this.NotifyListeners(this.inodes.length-1, "newfile");
    return this.inodes.length-1;
};


FS.prototype.CreateNode = function(filename, parentid, major, minor) {
    const parent_inode = this.inodes[parentid];
    if(this.is_forwarder(parent_inode))
    {
        const foreign_parentid = parent_inode.foreign_id;
        const foreign_id =
            this.follow_fs(parent_inode).CreateNode(filename, foreign_parentid, major, minor);
        return this.create_forwarder(parent_inode.mount_id, foreign_id);
    }
    var x = this.CreateInode();
    x.major = major;
    x.minor = minor;
    x.uid = this.inodes[parentid].uid;
    x.gid = this.inodes[parentid].gid;
    x.qid.type = S_IFSOCK >> 8;
    x.mode = (this.inodes[parentid].mode & 0x1B6);
    this.PushInode(x, parentid, filename);
    return this.inodes.length-1;
};

FS.prototype.CreateSymlink = function(filename, parentid, symlink) {
    const parent_inode = this.inodes[parentid];
    if(this.is_forwarder(parent_inode))
    {
        const foreign_parentid = parent_inode.foreign_id;
        const foreign_id =
            this.follow_fs(parent_inode).CreateSymlink(filename, foreign_parentid, symlink);
        return this.create_forwarder(parent_inode.mount_id, foreign_id);
    }
    var x = this.CreateInode();
    x.uid = this.inodes[parentid].uid;
    x.gid = this.inodes[parentid].gid;
    x.qid.type = S_IFLNK >> 8;
    x.symlink = symlink;
    x.mode = S_IFLNK;
    this.PushInode(x, parentid, filename);
    return this.inodes.length-1;
};

FS.prototype.CreateTextFile = async function(filename, parentid, str) {
    const parent_inode = this.inodes[parentid];
    if(this.is_forwarder(parent_inode))
    {
        const foreign_parentid = parent_inode.foreign_id;
        const foreign_id = await
            this.follow_fs(parent_inode).CreateTextFile(filename, foreign_parentid, str);
        return this.create_forwarder(parent_inode.mount_id, foreign_id);
    }
    var id = this.CreateFile(filename, parentid);
    var x = this.inodes[id];
    var data = new Uint8Array(str.length);
    x.size = str.length;
    for(var j = 0; j < str.length; j++) {
        data[j] = str.charCodeAt(j);
    }
    await this.set_data(id, data);
    return id;
};

/**
 * @param {Uint8Array} buffer
 */
FS.prototype.CreateBinaryFile = async function(filename, parentid, buffer) {
    const parent_inode = this.inodes[parentid];
    if(this.is_forwarder(parent_inode))
    {
        const foreign_parentid = parent_inode.foreign_id;
        const foreign_id = await
            this.follow_fs(parent_inode).CreateBinaryFile(filename, foreign_parentid, buffer);
        return this.create_forwarder(parent_inode.mount_id, foreign_id);
    }
    var id = this.CreateFile(filename, parentid);
    var x = this.inodes[id];
    var data = new Uint8Array(buffer.length);
    data.set(buffer);
    await this.set_data(id, data);
    x.size = buffer.length;
    return id;
};


FS.prototype.OpenInode = function(id, mode) {
    var inode = this.inodes[id];
    if(this.is_forwarder(inode))
    {
        return this.follow_fs(inode).OpenInode(inode.foreign_id, mode);
    }
    if((inode.mode&S_IFMT) === S_IFDIR) {
        this.FillDirectory(id);
    }
    /*
    var type = "";
    switch(inode.mode&S_IFMT) {
        case S_IFREG: type = "File"; break;
        case S_IFBLK: type = "Block Device"; break;
        case S_IFDIR: type = "Directory"; break;
        case S_IFCHR: type = "Character Device"; break;
    }
    */
    //dbg_log("open:" + this.GetFullPath(id) +  " type: " + inode.mode + " status:" + inode.status, LOG_9P);
    return true;
};

FS.prototype.CloseInode = async function(id) {
    //dbg_log("close: " + this.GetFullPath(id), LOG_9P);
    var inode = this.inodes[id];
    if(this.is_forwarder(inode))
    {
        return await this.follow_fs(inode).CloseInode(inode.foreign_id);
    }
    if(inode.status === STATUS_ON_STORAGE)
    {
        this.storage.uncache(inode.sha256sum);
    }
    if(inode.status === STATUS_UNLINKED) {
        //dbg_log("Filesystem: Delete unlinked file", LOG_9P);
        inode.status = STATUS_INVALID;
        await this.DeleteData(id);
    }
};

/**
 * @return {!Promise<number>} 0 if success, or -errno if failured.
 */
FS.prototype.Rename = async function(olddirid, oldname, newdirid, newname) {
    // dbg_log("Rename " + oldname + " to " + newname, LOG_9P);
    if((olddirid === newdirid) && (oldname === newname)) {
        return 0;
    }
    var oldid = this.Search(olddirid, oldname);
    if(oldid === -1)
    {
        return -ENOENT;
    }

    // For event notification near end of method.
    var oldpath = this.GetFullPath(olddirid) + "/" + oldname;

    var newid = this.Search(newdirid, newname);
    if(newid !== -1) {
        const ret = this.Unlink(newdirid, newname);
        if(ret < 0) return ret;
    }

    var idx = oldid; // idx contains the id which we want to rename
    var inode = this.inodes[idx];
    const olddir = this.inodes[olddirid];
    const newdir = this.inodes[newdirid];

    if(!this.is_forwarder(olddir) && !this.is_forwarder(newdir))
    {
        // Move inode within current filesystem.

        this.unlink_from_dir(olddirid, oldname);
        this.link_under_dir(newdirid, idx, newname);

        inode.qid.version++;
    }
    else if(this.is_forwarder(olddir) && olddir.mount_id === newdir.mount_id)
    {
        // Move inode within the same child filesystem.

        const ret = await
            this.follow_fs(olddir).Rename(olddir.foreign_id, oldname, newdir.foreign_id, newname);

        if(ret < 0) return ret;
    }
    else if(this.is_a_root(idx))
    {
        // The actual inode is a root of some descendant filesystem.
        // Moving mountpoint across fs not supported - needs to update all corresponding forwarders.
        dbg_log("XXX: Attempted to move mountpoint (" + oldname + ") - skipped", LOG_9P);
        return -EPERM;
    }
    else if(!this.IsDirectory(idx) && this.GetInode(idx).nlinks > 1)
    {
        // Move hardlinked inode vertically in mount tree.
        dbg_log("XXX: Attempted to move hardlinked file (" + oldname + ") " +
                "across filesystems - skipped", LOG_9P);
        return -EPERM;
    }
    else
    {
        // Jump between filesystems.

        // Can't work with both old and new inode information without first diverting the old
        // information into a new idx value.
        const diverted_old_idx = this.divert(olddirid, oldname);
        const old_real_inode = this.GetInode(idx);

        const data = await this.Read(diverted_old_idx, 0, old_real_inode.size);

        if(this.is_forwarder(newdir))
        {
            // Create new inode.
            const foreign_fs = this.follow_fs(newdir);
            const foreign_id = this.IsDirectory(diverted_old_idx) ?
                foreign_fs.CreateDirectory(newname, newdir.foreign_id) :
                foreign_fs.CreateFile(newname, newdir.foreign_id);

            const new_real_inode = foreign_fs.GetInode(foreign_id);
            this.copy_inode(old_real_inode, new_real_inode);

            // Point to this new location.
            this.set_forwarder(idx, newdir.mount_id, foreign_id);
        }
        else
        {
            // Replace current forwarder with real inode.
            this.delete_forwarder(inode);
            this.copy_inode(old_real_inode, inode);

            // Link into new location in this filesystem.
            this.link_under_dir(newdirid, idx, newname);
        }

        // Rewrite data to newly created destination.
        await this.ChangeSize(idx, old_real_inode.size);
        if(data && data.length)
        {
            await this.Write(idx, 0, data.length, data);
        }

        // Move children to newly created destination.
        if(this.IsDirectory(idx))
        {
            for(const child_filename of this.GetChildren(diverted_old_idx))
            {
                const ret = await this.Rename(diverted_old_idx, child_filename, idx, child_filename);
                if(ret < 0) return ret;
            }
        }

        // Perform destructive changes only after migration succeeded.
        await this.DeleteData(diverted_old_idx);
        const ret = this.Unlink(olddirid, oldname);
        if(ret < 0) return ret;
    }

    this.NotifyListeners(idx, "rename", {oldpath: oldpath});

    return 0;
};

FS.prototype.Write = async function(id, offset, count, buffer) {
    this.NotifyListeners(id, "write");
    var inode = this.inodes[id];

    if(this.is_forwarder(inode))
    {
        const foreign_id = inode.foreign_id;
        await this.follow_fs(inode).Write(foreign_id, offset, count, buffer);
        return;
    }

    var data = await this.get_buffer(id);

    if(!data || data.length < (offset+count)) {
        await this.ChangeSize(id, Math.floor(((offset+count)*3)/2));
        inode.size = offset + count;
        data = await this.get_buffer(id);
    } else
    if(inode.size < (offset+count)) {
        inode.size = offset + count;
    }
    if(buffer)
    {
        data.set(buffer.subarray(0, count), offset);
    }
    await this.set_data(id, data);
};

FS.prototype.Read = async function(inodeid, offset, count)
{
    const inode = this.inodes[inodeid];
    if(this.is_forwarder(inode))
    {
        const foreign_id = inode.foreign_id;
        return await this.follow_fs(inode).Read(foreign_id, offset, count);
    }

    return await this.get_data(inodeid, offset, count);
};

FS.prototype.Search = function(parentid, name) {
    const parent_inode = this.inodes[parentid];

    if(this.is_forwarder(parent_inode))
    {
        const foreign_parentid = parent_inode.foreign_id;
        const foreign_id = this.follow_fs(parent_inode).Search(foreign_parentid, name);
        if(foreign_id === -1) return -1;
        return this.get_forwarder(parent_inode.mount_id, foreign_id);
    }

    const childid = parent_inode.direntries.get(name);
    return childid === undefined ? -1 : childid;
};

FS.prototype.CountUsedInodes = function()
{
    let count = this.inodes.length;
    for(const { fs, backtrack } of this.mounts)
    {
        count += fs.CountUsedInodes();

        // Forwarder inodes don't count.
        count -=  backtrack.size;
    }
    return count;
};

FS.prototype.CountFreeInodes = function()
{
    let count = 1024 * 1024;
    for(const { fs } of this.mounts)
    {
        count += fs.CountFreeInodes();
    }
    return count;
};

FS.prototype.GetTotalSize = function() {
    let size = this.used_size;
    for(const { fs } of this.mounts)
    {
        size += fs.GetTotalSize();
    }
    return size;
    //var size = 0;
    //for(var i=0; i<this.inodes.length; i++) {
    //    var d = this.inodes[i].data;
    //    size += d ? d.length : 0;
    //}
    //return size;
};

FS.prototype.GetSpace = function() {
    let size = this.total_size;
    for(const { fs } of this.mounts)
    {
        size += fs.GetSpace();
    }
    return this.total_size;
};

/**
 * XXX: Not ideal.
 * @param {number} idx
 * @return {string}
 */
FS.prototype.GetDirectoryName = function(idx)
{
    const parent_inode = this.inodes[this.GetParent(idx)];

    if(this.is_forwarder(parent_inode))
    {
        return this.follow_fs(parent_inode).GetDirectoryName(this.inodes[idx].foreign_id);
    }

    // Root directory.
    if(!parent_inode) return "";

    for(const [name, childid] of parent_inode.direntries)
    {
        if(childid === idx) return name;
    }

    dbg_assert(false, "Filesystem: Found directory inode whose parent doesn't link to it");
    return "";
};

FS.prototype.GetFullPath = function(idx) {
    dbg_assert(this.IsDirectory(idx), "Filesystem: Cannot get full path of non-directory inode");

    var path = "";

    while(idx !== 0) {
        path = "/" + this.GetDirectoryName(idx) + path;
        idx = this.GetParent(idx);
    }
    return path.substring(1);
};

/**
 * @param {number} parentid
 * @param {number} targetid
 * @param {string} name
 * @return {number} 0 if success, or -errno if failured.
 */
FS.prototype.Link = function(parentid, targetid, name)
{
    if(this.IsDirectory(targetid))
    {
        return -EPERM;
    }

    const parent_inode = this.inodes[parentid];
    const inode = this.inodes[targetid];

    if(this.is_forwarder(parent_inode))
    {
        if(!this.is_forwarder(inode) || inode.mount_id !== parent_inode.mount_id)
        {
            dbg_log("XXX: Attempted to hardlink a file into a child filesystem - skipped", LOG_9P);
            return -EPERM;
        }
        return this.follow_fs(parent_inode).Link(parent_inode.foreign_id, inode.foreign_id, name);
    }

    if(this.is_forwarder(inode))
    {
        dbg_log("XXX: Attempted to hardlink file across filesystems - skipped", LOG_9P);
        return -EPERM;
    }

    this.link_under_dir(parentid, targetid, name);
    return 0;
};

FS.prototype.Unlink = function(parentid, name) {
    if(name === "." || name === "..")
    {
        // Also guarantees that root cannot be deleted.
        return -EPERM;
    }
    const idx = this.Search(parentid, name);
    const inode = this.inodes[idx];
    const parent_inode = this.inodes[parentid];
    //dbg_log("Unlink " + inode.name, LOG_9P);

    // forward if necessary
    if(this.is_forwarder(parent_inode))
    {
        dbg_assert(this.is_forwarder(inode), "Children of forwarders should be forwarders");

        const foreign_parentid = parent_inode.foreign_id;
        return this.follow_fs(parent_inode).Unlink(foreign_parentid, name);

        // Keep the forwarder dangling - file is still accessible.
    }

    if(this.IsDirectory(idx) && !this.IsEmpty(idx))
    {
        return -ENOTEMPTY;
    }

    this.unlink_from_dir(parentid, name);

    if(inode.nlinks === 0)
    {
        // don't delete the content. The file is still accessible
        inode.status = STATUS_UNLINKED;
        this.NotifyListeners(idx, "delete");
    }
    return 0;
};

FS.prototype.DeleteData = async function(idx)
{
    const inode = this.inodes[idx];
    if(this.is_forwarder(inode))
    {
        await this.follow_fs(inode).DeleteData(inode.foreign_id);
        return;
    }
    inode.size = 0;
    delete this.inodedata[idx];
};

/**
 * @private
 * @param {number} idx
 * @return {!Promise<Uint8Array>} The buffer that contains the file contents, which may be larger
 *      than the data itself. To ensure that any modifications done to this buffer is reflected
 *      to the file, call set_data with the modified buffer.
 */
FS.prototype.get_buffer = async function(idx)
{
    const inode = this.inodes[idx];
    dbg_assert(inode, `Filesystem get_buffer: idx ${idx} does not point to an inode`);

    if(this.inodedata[idx])
    {
        return this.inodedata[idx];
    }
    else if(inode.status === STATUS_ON_STORAGE)
    {
        dbg_assert(inode.sha256sum, "Filesystem get_data: found inode on server without sha256sum");
        return await this.storage.read(inode.sha256sum, 0, inode.size);
    }
    else
    {
        return null;
    }
};

/**
 * @private
 * @param {number} idx
 * @param {number} offset
 * @param {number} count
 * @return {!Promise<Uint8Array>}
 */
FS.prototype.get_data = async function(idx, offset, count)
{
    const inode = this.inodes[idx];
    dbg_assert(inode, `Filesystem get_data: idx ${idx} does not point to an inode`);

    if(this.inodedata[idx])
    {
        return this.inodedata[idx].subarray(offset, offset + count);
    }
    else if(inode.status === STATUS_ON_STORAGE)
    {
        dbg_assert(inode.sha256sum, "Filesystem get_data: found inode on server without sha256sum");
        return await this.storage.read(inode.sha256sum, offset, count);
    }
    else
    {
        return null;
    }
};

/**
 * @private
 * @param {number} idx
 * @param {Uint8Array} buffer
 */
FS.prototype.set_data = async function(idx, buffer)
{
    // Current scheme: Save all modified buffers into local inodedata.
    this.inodedata[idx] = buffer;
    if(this.inodes[idx].status === STATUS_ON_STORAGE)
    {
        this.inodes[idx].status = STATUS_OK;
        this.storage.uncache(this.inodes[idx].sha256sum);
    }
};

/**
 * @param {number} idx
 * @return {!Inode}
 */
FS.prototype.GetInode = function(idx)
{
    dbg_assert(!isNaN(idx), "Filesystem GetInode: NaN idx");
    dbg_assert(idx >= 0 && idx < this.inodes.length, "Filesystem GetInode: out of range idx:" + idx);

    const inode = this.inodes[idx];
    if(this.is_forwarder(inode))
    {
        return this.follow_fs(inode).GetInode(inode.foreign_id);
    }

    return inode;
};

FS.prototype.ChangeSize = async function(idx, newsize)
{
    var inode = this.GetInode(idx);
    var temp = await this.get_data(idx, 0, inode.size);
    //dbg_log("change size to: " + newsize, LOG_9P);
    if(newsize === inode.size) return;
    var data = new Uint8Array(newsize);
    inode.size = newsize;
    if(temp)
    {
        var size = Math.min(temp.length, inode.size);
        data.set(temp.subarray(0, size), 0);
    }
    await this.set_data(idx, data);
};

FS.prototype.SearchPath = function(path) {
    //path = path.replace(/\/\//g, "/");
    path = path.replace("//", "/");
    var walk = path.split("/");
    if(walk.length > 0 && walk[walk.length - 1].length === 0) walk.pop();
    if(walk.length > 0 && walk[0].length === 0) walk.shift();
    const n = walk.length;

    var parentid = -1;
    var id = 0;
    let forward_path = null;
    for(var i=0; i<n; i++) {
        parentid = id;
        id = this.Search(parentid, walk[i]);
        if(!forward_path && this.is_forwarder(this.inodes[parentid]))
        {
            forward_path = "/" + walk.slice(i).join("/");
        }
        if(id === -1) {
            if(i < n-1) return {id: -1, parentid: -1, name: walk[i], forward_path }; // one name of the path cannot be found
            return {id: -1, parentid: parentid, name: walk[i], forward_path}; // the last element in the path does not exist, but the parent
        }
    }
    return {id: id, parentid: parentid, name: walk[i], forward_path};
};
// -----------------------------------------------------

/**
 * @param {number} dirid
 * @param {Array<{parentid: number, name: string}>} list
 */
FS.prototype.GetRecursiveList = function(dirid, list) {
    if(this.is_forwarder(this.inodes[dirid]))
    {
        const foreign_fs = this.follow_fs(this.inodes[dirid]);
        const foreign_dirid = this.inodes[dirid].foreign_id;
        const mount_id = this.inodes[dirid].mount_id;

        const foreign_start = list.length;
        foreign_fs.GetRecursiveList(foreign_dirid, list);
        for(let i = foreign_start; i < list.length; i++)
        {
            list[i].parentid = this.get_forwarder(mount_id, list[i].parentid);
        }
        return;
    }
    for(const [name, id] of this.inodes[dirid].direntries)
    {
        if(name !== "." && name !== "..")
        {
            list.push({ parentid: dirid, name });
            if(this.IsDirectory(id))
            {
                this.GetRecursiveList(id, list);
            }
        }
    }
};

FS.prototype.RecursiveDelete = function(path) {
    var toDelete = [];
    var ids = this.SearchPath(path);
    if(ids.id === -1) return;

    this.GetRecursiveList(ids.id, toDelete);

    for(var i=toDelete.length-1; i>=0; i--)
    {
        const ret = this.Unlink(toDelete[i].parentid, toDelete[i].name);
        dbg_assert(ret === 0, "Filesystem RecursiveDelete failed at parent=" + toDelete[i].parentid +
            ", name='" + toDelete[i].name + "' with error code: " + (-ret));
    }
};

FS.prototype.DeleteNode = function(path) {
    var ids = this.SearchPath(path);
    if(ids.id === -1) return;

    if((this.inodes[ids.id].mode&S_IFMT) === S_IFREG){
        const ret = this.Unlink(ids.parentid, ids.name);
        dbg_assert(ret === 0, "Filesystem DeleteNode failed with error code: " + (-ret));
    }
    else if((this.inodes[ids.id].mode&S_IFMT) === S_IFDIR){
        this.RecursiveDelete(path);
        const ret = this.Unlink(ids.parentid, ids.name);
        dbg_assert(ret === 0, "Filesystem DeleteNode failed with error code: " + (-ret));
    }
};

/** @param {*=} info */
FS.prototype.NotifyListeners = function(id, action, info) {
    //if(info==undefined)
    //    info = {};

    //var path = this.GetFullPath(id);
    //if (this.watchFiles[path] === true && action=='write') {
    //  message.Send("WatchFileEvent", path);
    //}
    //for (var directory of this.watchDirectories) {
    //    if (this.watchDirectories.hasOwnProperty(directory)) {
    //        var indexOf = path.indexOf(directory)
    //        if(indexOf === 0 || indexOf === 1)
    //            message.Send("WatchDirectoryEvent", {path: path, event: action, info: info});
    //    }
    //}
};


FS.prototype.Check = function() {
    for(var i=1; i<this.inodes.length; i++)
    {
        if(this.inodes[i].status === STATUS_INVALID) continue;

        var inode = this.GetInode(i);
        if(inode.nlinks < 0) {
            dbg_log("Error in filesystem: negative nlinks=" + inode.nlinks + " at id =" + i, LOG_9P);
        }

        if(this.IsDirectory(i))
        {
            const inode = this.GetInode(i);
            if(this.IsDirectory(i) && this.GetParent(i) < 0) {
                dbg_log("Error in filesystem: negative parent id " + i, LOG_9P);
            }
            for(const [name, id] of inode.direntries)
            {
                if(name.length === 0) {
                    dbg_log("Error in filesystem: inode with no name and id " + id, LOG_9P);
                }

                for(const c of name) {
                    if(c < 32) {
                        dbg_log("Error in filesystem: Unallowed char in filename", LOG_9P);
                    }
                }
            }
        }
    }

};


FS.prototype.FillDirectory = function(dirid) {
    const inode = this.inodes[dirid];
    if(this.is_forwarder(inode))
    {
        // XXX: The ".." of a mountpoint should point back to an inode in this fs.
        // Otherwise, ".." gets the wrong qid and mode.
        this.follow_fs(inode).FillDirectory(inode.foreign_id);
        return;
    }

    let size = 0;
    for(const name of inode.direntries.keys())
    {
        size += 13 + 8 + 1 + 2 + texten.encode(name).length;
    }
    const data = this.inodedata[dirid] = new Uint8Array(size);
    inode.size = size;

    let offset = 0x0;
    for(const [name, id] of inode.direntries)
    {
        const child = this.GetInode(id);
        offset += marshall.Marshall(
            ["Q", "d", "b", "s"],
            [child.qid,
            offset+13+8+1+2+texten.encode(name).length,
            child.mode >> 12,
            name],
            data, offset);
    }
};

FS.prototype.RoundToDirentry = function(dirid, offset_target)
{
    const data = this.inodedata[dirid];
    dbg_assert(data, `FS directory data for dirid=${dirid} should be generated`);
    dbg_assert(data.length, "FS directory should have at least an entry");

    if(offset_target >= data.length)
    {
        return data.length;
    }

    let offset = 0;
    while(true)
    {
        const next_offset = marshall.Unmarshall(["Q", "d"], data, { offset })[1];
        if(next_offset > offset_target) break;
        offset = next_offset;
    }

    return offset;
};

/**
 * @param {number} idx
 * @return {boolean}
 */
FS.prototype.IsDirectory = function(idx)
{
    const inode = this.inodes[idx];
    if(this.is_forwarder(inode))
    {
        return this.follow_fs(inode).IsDirectory(inode.foreign_id);
    }
    return (inode.mode & S_IFMT) === S_IFDIR;
};

/**
 * @param {number} idx
 * @return {boolean}
 */
FS.prototype.IsEmpty = function(idx)
{
    const inode = this.inodes[idx];
    if(this.is_forwarder(inode))
    {
        return this.follow_fs(inode).IsDirectory(inode.foreign_id);
    }
    for(const name of inode.direntries.keys())
    {
        if(name !== "." && name !== "..") return false;
    }
    return true;
};

/**
 * @param {number} idx
 * @return {!Array<string>} List of children names
 */
FS.prototype.GetChildren = function(idx)
{
    dbg_assert(this.IsDirectory(idx), "Filesystem: cannot get children of non-directory inode");
    const inode = this.inodes[idx];
    if(this.is_forwarder(inode))
    {
        return this.follow_fs(inode).GetChildren(inode.foreign_id);
    }
    const children = [];
    for(const name of inode.direntries.keys())
    {
        if(name !== "." && name !== "..")
        {
            children.push(name);
        }
    }
    return children;
};

/**
 * @param {number} idx
 * @return {number} Local idx of parent
 */
FS.prototype.GetParent = function(idx)
{
    dbg_assert(this.IsDirectory(idx), "Filesystem: cannot get parent of non-directory inode");

    const inode = this.inodes[idx];

    if(this.should_be_linked(inode))
    {
        return inode.direntries.get("..");
    }
    else
    {
        const foreign_dirid = this.follow_fs(inode).GetParent(inode.foreign_id);
        dbg_assert(foreign_dirid !== -1, "Filesystem: should not have invalid parent ids");
        return this.get_forwarder(inode.mount_id, foreign_dirid);
    }
};


// -----------------------------------------------------

// only support for security.capabilities
// should return a  "struct vfs_cap_data" defined in
// linux/capability for format
// check also:
//   sys/capability.h
//   http://lxr.free-electrons.com/source/security/commoncap.c#L376
//   http://man7.org/linux/man-pages/man7/capabilities.7.html
//   http://man7.org/linux/man-pages/man8/getcap.8.html
//   http://man7.org/linux/man-pages/man3/libcap.3.html
FS.prototype.PrepareCAPs = function(id) {
    var inode = this.GetInode(id);
    if(inode.caps) return inode.caps.length;
    inode.caps = new Uint8Array(20);
    // format is little endian
    // note: getxattr returns -EINVAL if using revision 1 format.
    // note: getxattr presents revision 3 as revision 2 when revision 3 is not needed.
    // magic_etc (revision=0x02: 20 bytes)
    inode.caps[0]  = 0x00;
    inode.caps[1]  = 0x00;
    inode.caps[2]  = 0x00;
    inode.caps[3]  = 0x02;

    // lower
    // permitted (first 32 capabilities)
    inode.caps[4]  = 0xFF;
    inode.caps[5]  = 0xFF;
    inode.caps[6]  = 0xFF;
    inode.caps[7]  = 0xFF;
    // inheritable (first 32 capabilities)
    inode.caps[8]  = 0xFF;
    inode.caps[9]  = 0xFF;
    inode.caps[10] = 0xFF;
    inode.caps[11] = 0xFF;

    // higher
    // permitted (last 6 capabilities)
    inode.caps[12] = 0x3F;
    inode.caps[13] = 0x00;
    inode.caps[14] = 0x00;
    inode.caps[15] = 0x00;
    // inheritable (last 6 capabilities)
    inode.caps[16] = 0x3F;
    inode.caps[17] = 0x00;
    inode.caps[18] = 0x00;
    inode.caps[19] = 0x00;

    return inode.caps.length;
};

// -----------------------------------------------------

/**
 * @constructor
 * @param {FS} filesystem
 */
function FSMountInfo(filesystem)
{
    /** @type {FS}*/
    this.fs = filesystem;

    /**
     * Maps foreign inode id back to local inode id.
     * @type {!Map<number,number>}
     */
    this.backtrack = new Map();
}

FSMountInfo.prototype.get_state = function()
{
    const state = [];

    state[0] = this.fs;
    state[1] = [...this.backtrack];

    return state;
};

FSMountInfo.prototype.set_state = function(state)
{
    this.fs = state[0];
    this.backtrack = new Map(state[1]);
};

/**
 * @private
 * @param {number} idx Local idx of inode.
 * @param {number} mount_id Mount number of the destination fs.
 * @param {number} foreign_id Foreign idx of destination inode.
 */
FS.prototype.set_forwarder = function(idx, mount_id, foreign_id)
{
    const inode = this.inodes[idx];

    dbg_assert(inode.nlinks === 0,
        "Filesystem: attempted to convert an inode into forwarder before unlinking the inode");

    if(this.is_forwarder(inode))
    {
        this.mounts[inode.mount_id].backtrack.delete(inode.foreign_id);
    }

    inode.status = STATUS_FORWARDING;
    inode.mount_id = mount_id;
    inode.foreign_id = foreign_id;

    this.mounts[mount_id].backtrack.set(foreign_id, idx);
};

/**
 * @private
 * @param {number} mount_id Mount number of the destination fs.
 * @param {number} foreign_id Foreign idx of destination inode.
 * @return {number} Local idx of newly created forwarder.
 */
FS.prototype.create_forwarder = function(mount_id, foreign_id)
{
    const inode = this.CreateInode();

    const idx = this.inodes.length;
    this.inodes.push(inode);
    inode.fid = idx;

    this.set_forwarder(idx, mount_id, foreign_id);
    return idx;
};

/**
 * @private
 * @param {Inode} inode
 * @return {boolean}
 */
FS.prototype.is_forwarder = function(inode)
{
    return inode.status === STATUS_FORWARDING;
};

/**
 * Whether the inode it points to is a root of some filesystem.
 * @private
 * @param {number} idx
 * @return {boolean}
 */
FS.prototype.is_a_root = function(idx)
{
    return this.GetInode(idx).fid === 0;
};

/**
 * Ensures forwarder exists, and returns such forwarder, for the described foreign inode.
 * @private
 * @param {number} mount_id
 * @param {number} foreign_id
 * @return {number} Local idx of a forwarder to described inode.
 */
FS.prototype.get_forwarder = function(mount_id, foreign_id)
{
    const mount = this.mounts[mount_id];

    dbg_assert(foreign_id >= 0, "Filesystem get_forwarder: invalid foreign_id: " + foreign_id);
    dbg_assert(mount, "Filesystem get_forwarder: invalid mount number: " + mount_id);

    const result = mount.backtrack.get(foreign_id);

    if(result === undefined)
    {
        // Create if not already exists.
        return this.create_forwarder(mount_id, foreign_id);
    }

    return result;
};

/**
 * @private
 * @param {Inode} inode
 */
FS.prototype.delete_forwarder = function(inode)
{
    dbg_assert(this.is_forwarder(inode), "Filesystem delete_forwarder: expected forwarder");

    inode.status = STATUS_INVALID;
    this.mounts[inode.mount_id].backtrack.delete(inode.foreign_id);
};

/**
 * @private
 * @param {Inode} inode
 * @return {FS}
 */
FS.prototype.follow_fs = function(inode)
{
    const mount = this.mounts[inode.mount_id];

    dbg_assert(this.is_forwarder(inode),
        "Filesystem follow_fs: inode should be a forwarding inode");
    dbg_assert(mount, "Filesystem follow_fs: inode<id=" + inode.fid +
        "> should point to valid mounted FS");

    return mount.fs;
};

/**
 * Mount another filesystem to given path.
 * @param {string} path
 * @param {FS} fs
 * @return {number} inode id of mount point if successful, or -errno if mounting failed.
 */
FS.prototype.Mount = function(path, fs)
{
    dbg_assert(fs.qidcounter === this.qidcounter,
        "Cannot mount filesystem whose qid numbers aren't synchronised with current filesystem.");

    const path_infos = this.SearchPath(path);

    if(path_infos.parentid === -1)
    {
        dbg_log("Mount failed: parent for path not found: " + path, LOG_9P);
        return -ENOENT;
    }
    if(path_infos.id !== -1)
    {
        dbg_log("Mount failed: file already exists at path: " + path, LOG_9P);
        return -EEXIST;
    }
    if(path_infos.forward_path)
    {
        const parent = this.inodes[path_infos.parentid];
        const ret = this.follow_fs(parent).Mount(path_infos.forward_path, fs);
        if(ret < 0) return ret;
        return this.get_forwarder(parent.mount_id, ret);
    }

    const mount_id = this.mounts.length;
    this.mounts.push(new FSMountInfo(fs));

    const idx = this.create_forwarder(mount_id, 0);
    this.link_under_dir(path_infos.parentid, idx, path_infos.name);

    return idx;
};

/**
 * @constructor
 */
function FSLockRegion()
{
    this.type = P9_LOCK_TYPE_UNLCK;
    this.start = 0;
    this.length = Infinity;
    this.proc_id = -1;
    this.client_id = "";
}

FSLockRegion.prototype.get_state = function()
{
    const state = [];

    state[0] = this.type;
    state[1] = this.start;
    // Infinity is not JSON.stringify-able
    state[2] = this.length === Infinity ? 0 : this.length;
    state[3] = this.proc_id;
    state[4] = this.client_id;

    return state;
};

FSLockRegion.prototype.set_state = function(state)
{
    this.type = state[0];
    this.start = state[1];
    this.length = state[2] === 0 ? Infinity : state[2];
    this.proc_id = state[3];
    this.client_id = state[4];
};

/**
 * @return {FSLockRegion}
 */
FSLockRegion.prototype.clone = function()
{
    const new_region = new FSLockRegion();
    new_region.set_state(this.get_state());
    return new_region;
};

/**
 * @param {FSLockRegion} region
 * @return {boolean}
 */
FSLockRegion.prototype.conflicts_with = function(region)
{
    if(this.proc_id === region.proc_id && this.client_id === region.client_id) return false;
    if(this.type === P9_LOCK_TYPE_UNLCK || region.type === P9_LOCK_TYPE_UNLCK) return false;
    if(this.type !== P9_LOCK_TYPE_WRLCK && region.type !== P9_LOCK_TYPE_WRLCK) return false;
    if(this.start + this.length <= region.start) return false;
    if(region.start + region.length <= this.start) return false;
    return true;
};

/**
 * @param {FSLockRegion} region
 * @return {boolean}
 */
FSLockRegion.prototype.is_alike = function(region)
{
    return region.proc_id === this.proc_id &&
        region.client_id === this.client_id &&
        region.type === this.type;
};

/**
 * @param {FSLockRegion} region
 * @return {boolean}
 */
FSLockRegion.prototype.may_merge_after = function(region)
{
    return this.is_alike(region) && region.start + region.length === this.start;
};

/**
 * @param {number} type
 * @param {number} start
 * @param {number} length
 * @param {number} proc_id
 * @param {string} client_id
 * @return {!FSLockRegion}
 */
FS.prototype.DescribeLock = function(type, start, length, proc_id, client_id)
{
    dbg_assert(type === P9_LOCK_TYPE_RDLCK ||
        type === P9_LOCK_TYPE_WRLCK ||
        type === P9_LOCK_TYPE_UNLCK,
        "Filesystem: Invalid lock type: " + type);
    dbg_assert(start >= 0, "Filesystem: Invalid negative lock starting offset: " + start);
    dbg_assert(length > 0, "Filesystem: Invalid non-positive lock length: " + length);

    const lock = new FSLockRegion();
    lock.type = type;
    lock.start = start;
    lock.length = length;
    lock.proc_id = proc_id;
    lock.client_id = client_id;

    return lock;
};

/**
 * @param {number} id
 * @param {FSLockRegion} request
 * @return {FSLockRegion} The first conflicting lock found, or null if requested lock is possible.
 */
FS.prototype.GetLock = function(id, request)
{
    const inode = this.inodes[id];

    if(this.is_forwarder(inode))
    {
        const foreign_id = inode.foreign_id;
        return this.follow_fs(inode).GetLock(foreign_id, request);
    }

    for(const region of inode.locks)
    {
        if(request.conflicts_with(region))
        {
            return region.clone();
        }
    }
    return null;
};

/**
 * @param {number} id
 * @param {FSLockRegion} request
 * @param {number} flags
 * @return {number} One of P9_LOCK_SUCCESS / P9_LOCK_BLOCKED / P9_LOCK_ERROR / P9_LOCK_GRACE.
 */
FS.prototype.Lock = function(id, request, flags)
{
    const inode = this.inodes[id];

    if(this.is_forwarder(inode))
    {
        const foreign_id = inode.foreign_id;
        return this.follow_fs(inode).Lock(foreign_id, request, flags);
    }

    request = request.clone();

    // (1) Check whether lock is possible before any modification.
    if(request.type !== P9_LOCK_TYPE_UNLCK && this.GetLock(id, request))
    {
        return P9_LOCK_BLOCKED;
    }

    // (2) Subtract requested region from locks of the same owner.
    for(let i = 0; i < inode.locks.length; i++)
    {
        const region = inode.locks[i];

        dbg_assert(region.length > 0,
            "Filesystem: Found non-positive lock region length: " + region.length);
        dbg_assert(region.type === P9_LOCK_TYPE_RDLCK || region.type === P9_LOCK_TYPE_WRLCK,
            "Filesystem: Found invalid lock type: " + region.type);
        dbg_assert(!inode.locks[i-1] || inode.locks[i-1].start <= region.start,
            "Filesystem: Locks should be sorted by starting offset");

        // Skip to requested region.
        if(region.start + region.length <= request.start) continue;

        // Check whether we've skipped past the requested region.
        if(request.start + request.length <= region.start) break;

        // Skip over locks of different owners.
        if(region.proc_id !== request.proc_id || region.client_id !== request.client_id)
        {
            dbg_assert(!region.conflicts_with(request),
                "Filesytem: Found conflicting lock region, despite already checked for conflicts");
            continue;
        }

        // Pretend region would be split into parts 1 and 2.
        const start1 = region.start;
        const start2 = request.start + request.length;
        const length1 = request.start - start1;
        const length2 = region.start + region.length - start2;

        if(length1 > 0 && length2 > 0 && region.type === request.type)
        {
            // Requested region is already locked with the required type.
            // Return early - no need to modify anything.
            return P9_LOCK_SUCCESS;
        }

        if(length1 > 0)
        {
            // Shrink from right / first half of the split.
            region.length = length1;
        }

        if(length1 <= 0 && length2 > 0)
        {
            // Shrink from left.
            region.start = start2;
            region.length = length2;
        }
        else if(length2 > 0)
        {
            // Add second half of the split.

            // Fast-forward to correct location.
            while(i < inode.locks.length && inode.locks[i].start < start2) i++;

            inode.locks.splice(i, 0,
                this.DescribeLock(region.type, start2, length2, region.proc_id, region.client_id));
        }
        else if(length1 <= 0)
        {
            // Requested region completely covers this region. Delete.
            inode.locks.splice(i, 1);
            i--;
        }
    }

    // (3) Insert requested lock region as a whole.
    // No point in adding the requested lock region as fragmented bits in the above loop
    // and having to merge them all back into one.
    if(request.type !== P9_LOCK_TYPE_UNLCK)
    {
        let new_region = request;
        let has_merged = false;
        let i = 0;

        // Fast-forward to requested position, and try merging with previous region.
        for(; i < inode.locks.length; i++)
        {
            if(new_region.may_merge_after(inode.locks[i]))
            {
                inode.locks[i].length += request.length;
                new_region = inode.locks[i];
                has_merged = true;
            }
            if(request.start <= inode.locks[i].start) break;
        }

        if(!has_merged)
        {
            inode.locks.splice(i, 0, new_region);
            i++;
        }

        // Try merging with the subsequent alike region.
        for(; i < inode.locks.length; i++)
        {
            if(!inode.locks[i].is_alike(new_region)) continue;

            if(inode.locks[i].may_merge_after(new_region))
            {
                new_region.length += inode.locks[i].length;
                inode.locks.splice(i, 1);
            }

            // No more mergable regions after this.
            break;
        }
    }

    return P9_LOCK_SUCCESS;
};

FS.prototype.read_dir = function(path)
{
    const p = this.SearchPath(path);

    if(p.id === -1)
    {
        return undefined;
    }

    const dir = this.GetInode(p.id);

    return Array.from(dir.direntries.keys()).filter(path => path !== "." && path !== "..");
};

FS.prototype.read_file = function(file)
{
    const p = this.SearchPath(file);

    if(p.id === -1)
    {
        return Promise.resolve(null);
    }

    const inode = this.GetInode(p.id);

    return this.Read(p.id, 0, inode.size);
};


// ---- File: lib/9p.js ----
// -------------------------------------------------
// --------------------- 9P ------------------------
// -------------------------------------------------
// Implementation of the 9p filesystem device following the
// 9P2000.L protocol ( https://code.google.com/p/diod/wiki/protocol )








// For Types Only




/**
 * @const
 * More accurate filenames in 9p debug messages at the cost of performance.
 */
const TRACK_FILENAMES = false;

// Feature bit (bit position) for mount tag.
const VIRTIO_9P_F_MOUNT_TAG = 0;
// Assumed max tag length in bytes.
const VIRTIO_9P_MAX_TAGLEN = 254;

const MAX_REPLYBUFFER_SIZE = 16 * 1024 * 1024;

// TODO
// flush

const EPERM = 1;       /* Operation not permitted */
const ENOENT = 2;      /* No such file or directory */
const EEXIST = 17;      /* File exists */
const EINVAL = 22;     /* Invalid argument */
const EOPNOTSUPP = 95;  /* Operation is not supported */
const ENOTEMPTY = 39;  /* Directory not empty */
const EPROTO    = 71;  /* Protocol error */

var P9_SETATTR_MODE = 0x00000001;
var P9_SETATTR_UID = 0x00000002;
var P9_SETATTR_GID = 0x00000004;
var P9_SETATTR_SIZE = 0x00000008;
var P9_SETATTR_ATIME = 0x00000010;
var P9_SETATTR_MTIME = 0x00000020;
var P9_SETATTR_CTIME = 0x00000040;
var P9_SETATTR_ATIME_SET = 0x00000080;
var P9_SETATTR_MTIME_SET = 0x00000100;

var P9_STAT_MODE_DIR = 0x80000000;
var P9_STAT_MODE_APPEND = 0x40000000;
var P9_STAT_MODE_EXCL = 0x20000000;
var P9_STAT_MODE_MOUNT = 0x10000000;
var P9_STAT_MODE_AUTH = 0x08000000;
var P9_STAT_MODE_TMP = 0x04000000;
var P9_STAT_MODE_SYMLINK = 0x02000000;
var P9_STAT_MODE_LINK = 0x01000000;
var P9_STAT_MODE_DEVICE = 0x00800000;
var P9_STAT_MODE_NAMED_PIPE = 0x00200000;
var P9_STAT_MODE_SOCKET = 0x00100000;
var P9_STAT_MODE_SETUID = 0x00080000;
var P9_STAT_MODE_SETGID = 0x00040000;
var P9_STAT_MODE_SETVTX = 0x00010000;

const P9_LOCK_TYPE_RDLCK = 0;
const P9_LOCK_TYPE_WRLCK = 1;
const P9_LOCK_TYPE_UNLCK = 2;
const P9_LOCK_TYPES = ["shared", "exclusive", "unlock"];

const P9_LOCK_FLAGS_BLOCK = 1;
const P9_LOCK_FLAGS_RECLAIM = 2;

const P9_LOCK_SUCCESS = 0;
const P9_LOCK_BLOCKED = 1;
const P9_LOCK_ERROR = 2;
const P9_LOCK_GRACE = 3;

var FID_NONE = -1;
var FID_INODE = 1;
var FID_XATTR = 2;

function range(size)
{
    return Array.from(Array(size).keys());
}

/**
 * @constructor
 *
 * @param {FS} filesystem
 * @param {CPU} cpu
 */
function Virtio9p(filesystem, cpu, bus) {
    /** @type {FS} */
    this.fs = filesystem;

    /** @const @type {BusConnector} */
    this.bus = bus;

    //this.configspace = [0x0, 0x4, 0x68, 0x6F, 0x73, 0x74]; // length of string and "host" string
    //this.configspace = [0x0, 0x9, 0x2F, 0x64, 0x65, 0x76, 0x2F, 0x72, 0x6F, 0x6F, 0x74 ]; // length of string and "/dev/root" string
    this.configspace_tagname = [0x68, 0x6F, 0x73, 0x74, 0x39, 0x70]; // "host9p" string
    this.configspace_taglen = this.configspace_tagname.length; // num bytes
    this.VERSION = "9P2000.L";
    this.BLOCKSIZE = 8192; // Let's define one page.
    this.msize = 8192; // maximum message size
    this.replybuffer = new Uint8Array(this.msize*2); // Twice the msize to stay on the safe site
    this.replybuffersize = 0;

    this.fids = [];

    /** @type {VirtIO} */
    this.virtio = new VirtIO(cpu,
    {
        name: "virtio-9p",
        pci_id: 0x06 << 3,
        device_id: 0x1049,
        subsystem_device_id: 9,
        common:
        {
            initial_port: 0xA800,
            queues:
            [
                {
                    size_supported: 32,
                    notify_offset: 0,
                },
            ],
            features:
            [
                VIRTIO_9P_F_MOUNT_TAG,
                VIRTIO_F_VERSION_1,
                VIRTIO_F_RING_EVENT_IDX,
                VIRTIO_F_RING_INDIRECT_DESC,
            ],
            on_driver_ok: () => {},
        },
        notification:
        {
            initial_port: 0xA900,
            single_handler: false,
            handlers:
            [
                (queue_id) =>
                {
                    if(queue_id !== 0)
                    {
                        dbg_assert(false, "Virtio9P Notified for non-existent queue: " + queue_id +
                            " (expected queue_id of 0)");
                        return;
                    }
                    while(this.virtqueue.has_request())
                    {
                        const bufchain = this.virtqueue.pop_request();
                        this.ReceiveRequest(bufchain);
                    }
                    this.virtqueue.notify_me_after(0);
                    // Don't flush replies here: async replies are not completed yet.
                },
            ],
        },
        isr_status:
        {
            initial_port: 0xA700,
        },
        device_specific:
        {
            initial_port: 0xA600,
            struct:
            [
                {
                    bytes: 2,
                    name: "mount tag length",
                    read: () => this.configspace_taglen,
                    write: data => { /* read only */ },
                },
            ].concat(range(VIRTIO_9P_MAX_TAGLEN).map(index =>
                ({
                    bytes: 1,
                    name: "mount tag name " + index,
                    // Note: configspace_tagname may have changed after set_state
                    read: () => this.configspace_tagname[index] || 0,
                    write: data => { /* read only */ },
                })
            )),
        },
    });
    this.virtqueue = this.virtio.queues[0];
}

Virtio9p.prototype.get_state = function()
{
    var state = [];

    state[0] = this.configspace_tagname;
    state[1] = this.configspace_taglen;
    state[2] = this.virtio;
    state[3] = this.VERSION;
    state[4] = this.BLOCKSIZE;
    state[5] = this.msize;
    state[6] = this.replybuffer;
    state[7] = this.replybuffersize;
    state[8] = this.fids.map(function(f) { return [f.inodeid, f.type, f.uid, f.dbg_name]; });
    state[9] = this.fs;

    return state;
};

Virtio9p.prototype.set_state = function(state)
{
    this.configspace_tagname = state[0];
    this.configspace_taglen = state[1];
    this.virtio.set_state(state[2]);
    this.virtqueue = this.virtio.queues[0];
    this.VERSION = state[3];
    this.BLOCKSIZE = state[4];
    this.msize = state[5];
    this.replybuffer = state[6];
    this.replybuffersize = state[7];
    this.fids = state[8].map(function(f)
    {
        return { inodeid: f[0], type: f[1], uid: f[2], dbg_name: f[3] };
    });
    this.fs.set_state(state[9]);
};

// Note: dbg_name is only used for debugging messages and may not be the same as the filename,
// since it is not synchronised with renames done outside of 9p. Hard-links, linking and unlinking
// operations also mean that having a single filename no longer makes sense.
// Set TRACK_FILENAMES = true to sync dbg_name during 9p renames.
Virtio9p.prototype.Createfid = function(inodeid, type, uid, dbg_name) {
    return {inodeid, type, uid, dbg_name};
};

Virtio9p.prototype.update_dbg_name = function(idx, newname)
{
    for(const fid of this.fids)
    {
        if(fid.inodeid === idx) fid.dbg_name = newname;
    }
};

Virtio9p.prototype.reset = function() {
    this.fids = [];
    this.virtio.reset();
};


Virtio9p.prototype.BuildReply = function(id, tag, payloadsize) {
    dbg_assert(payloadsize >= 0, "9P: Negative payload size");
    marshall.Marshall(["w", "b", "h"], [payloadsize+7, id+1, tag], this.replybuffer, 0);
    if((payloadsize+7) >= this.replybuffer.length) {
        dbg_log("Error in 9p: payloadsize exceeds maximum length", LOG_9P);
    }
    //for(var i=0; i<payload.length; i++)
    //    this.replybuffer[7+i] = payload[i];
    this.replybuffersize = payloadsize+7;
};

Virtio9p.prototype.SendError = function (tag, errormsg, errorcode) {
    //var size = marshall.Marshall(["s", "w"], [errormsg, errorcode], this.replybuffer, 7);
    var size = marshall.Marshall(["w"], [errorcode], this.replybuffer, 7);
    this.BuildReply(6, tag, size);
};

Virtio9p.prototype.SendReply = function (bufchain) {
    dbg_assert(this.replybuffersize >= 0, "9P: Negative replybuffersize");
    bufchain.set_next_blob(this.replybuffer.subarray(0, this.replybuffersize));
    this.virtqueue.push_reply(bufchain);
    this.virtqueue.flush_replies();
};

Virtio9p.prototype.ReceiveRequest = async function (bufchain) {
    // TODO: split into header + data blobs to avoid unnecessary copying.
    const buffer = new Uint8Array(bufchain.length_readable);
    bufchain.get_next_blob(buffer);

    const state = { offset : 0 };
    var header = marshall.Unmarshall(["w", "b", "h"], buffer, state);
    var size = header[0];
    var id = header[1];
    var tag = header[2];
    //dbg_log("size:" + size + " id:" + id + " tag:" + tag, LOG_9P);

    switch(id)
    {
        case 8: // statfs
            size = this.fs.GetTotalSize(); // size used by all files
            var space = this.fs.GetSpace();
            var req = [];
            req[0] = 0x01021997;
            req[1] = this.BLOCKSIZE; // optimal transfer block size
            req[2] = Math.floor(space/req[1]); // free blocks
            req[3] = req[2] - Math.floor(size/req[1]); // free blocks in fs
            req[4] = req[2] - Math.floor(size/req[1]); // free blocks avail to non-superuser
            req[5] = this.fs.CountUsedInodes(); // total number of inodes
            req[6] = this.fs.CountFreeInodes();
            req[7] = 0; // file system id?
            req[8] = 256; // maximum length of filenames

            size = marshall.Marshall(["w", "w", "d", "d", "d", "d", "d", "d", "w"], req, this.replybuffer, 7);
            this.BuildReply(id, tag, size);
            this.SendReply(bufchain);
            break;

        case 112: // topen
        case 12: // tlopen
            var req = marshall.Unmarshall(["w", "w"], buffer, state);
            var fid = req[0];
            var mode = req[1];
            dbg_log("[open] fid=" + fid + ", mode=" + mode, LOG_9P);
            var idx = this.fids[fid].inodeid;
            var inode = this.fs.GetInode(idx);
            dbg_log("file open " + this.fids[fid].dbg_name, LOG_9P);
            //if (inode.status === STATUS_LOADING) return;
            var ret = this.fs.OpenInode(idx, mode);

            this.fs.AddEvent(this.fids[fid].inodeid,
                function() {
                    dbg_log("file opened " + this.fids[fid].dbg_name + " tag:"+tag, LOG_9P);
                    var req = [];
                    req[0] = inode.qid;
                    req[1] = this.msize - 24;
                    marshall.Marshall(["Q", "w"], req, this.replybuffer, 7);
                    this.BuildReply(id, tag, 13+4);
                    this.SendReply(bufchain);
                }.bind(this)
            );
            break;

        case 70: // link
            var req = marshall.Unmarshall(["w", "w", "s"], buffer, state);
            var dfid = req[0];
            var fid = req[1];
            var name = req[2];
            dbg_log("[link] dfid=" + dfid + ", name=" + name, LOG_9P);

            var ret = this.fs.Link(this.fids[dfid].inodeid, this.fids[fid].inodeid, name);

            if(ret < 0)
            {
                let error_message = "";
                if(ret === -EPERM) error_message = "Operation not permitted";
                else
                {
                    error_message = "Unknown error: " + (-ret);
                    dbg_assert(false, "[link]: Unexpected error code: " + (-ret));
                }
                this.SendError(tag, error_message, -ret);
                this.SendReply(bufchain);
                break;
            }

            this.BuildReply(id, tag, 0);
            this.SendReply(bufchain);
            break;

        case 16: // symlink
            var req = marshall.Unmarshall(["w", "s", "s", "w"], buffer, state);
            var fid = req[0];
            var name = req[1];
            var symgt = req[2];
            var gid = req[3];
            dbg_log("[symlink] fid=" + fid + ", name=" + name + ", symgt=" + symgt + ", gid=" + gid, LOG_9P);
            var idx = this.fs.CreateSymlink(name, this.fids[fid].inodeid, symgt);
            var inode = this.fs.GetInode(idx);
            inode.uid = this.fids[fid].uid;
            inode.gid = gid;
            marshall.Marshall(["Q"], [inode.qid], this.replybuffer, 7);
            this.BuildReply(id, tag, 13);
            this.SendReply(bufchain);
            break;

        case 18: // mknod
            var req = marshall.Unmarshall(["w", "s", "w", "w", "w", "w"], buffer, state);
            var fid = req[0];
            var name = req[1];
            var mode = req[2];
            var major = req[3];
            var minor = req[4];
            var gid = req[5];
            dbg_log("[mknod] fid=" + fid + ", name=" + name + ", major=" + major + ", minor=" + minor+ "", LOG_9P);
            var idx = this.fs.CreateNode(name, this.fids[fid].inodeid, major, minor);
            var inode = this.fs.GetInode(idx);
            inode.mode = mode;
            //inode.mode = mode | S_IFCHR; // XXX: fails "Mknod - fifo" test
            inode.uid = this.fids[fid].uid;
            inode.gid = gid;
            marshall.Marshall(["Q"], [inode.qid], this.replybuffer, 7);
            this.BuildReply(id, tag, 13);
            this.SendReply(bufchain);
            break;


        case 22: // TREADLINK
            var req = marshall.Unmarshall(["w"], buffer, state);
            var fid = req[0];
            var inode = this.fs.GetInode(this.fids[fid].inodeid);
            dbg_log("[readlink] fid=" + fid + " name=" + this.fids[fid].dbg_name + " target=" + inode.symlink, LOG_9P);
            size = marshall.Marshall(["s"], [inode.symlink], this.replybuffer, 7);
            this.BuildReply(id, tag, size);
            this.SendReply(bufchain);
            break;


        case 72: // tmkdir
            var req = marshall.Unmarshall(["w", "s", "w", "w"], buffer, state);
            var fid = req[0];
            var name = req[1];
            var mode = req[2];
            var gid = req[3];
            dbg_log("[mkdir] fid=" + fid + ", name=" + name + ", mode=" + mode + ", gid=" + gid, LOG_9P);
            var idx = this.fs.CreateDirectory(name, this.fids[fid].inodeid);
            var inode = this.fs.GetInode(idx);
            inode.mode = mode | S_IFDIR;
            inode.uid = this.fids[fid].uid;
            inode.gid = gid;
            marshall.Marshall(["Q"], [inode.qid], this.replybuffer, 7);
            this.BuildReply(id, tag, 13);
            this.SendReply(bufchain);
            break;

        case 14: // tlcreate
            var req = marshall.Unmarshall(["w", "s", "w", "w", "w"], buffer, state);
            var fid = req[0];
            var name = req[1];
            var flags = req[2];
            var mode = req[3];
            var gid = req[4];
            this.bus.send("9p-create", [name, this.fids[fid].inodeid]);
            dbg_log("[create] fid=" + fid + ", name=" + name + ", flags=" + flags + ", mode=" + mode + ", gid=" + gid, LOG_9P);
            var idx = this.fs.CreateFile(name, this.fids[fid].inodeid);
            this.fids[fid].inodeid = idx;
            this.fids[fid].type = FID_INODE;
            this.fids[fid].dbg_name = name;
            var inode = this.fs.GetInode(idx);
            inode.uid = this.fids[fid].uid;
            inode.gid = gid;
            inode.mode = mode | S_IFREG;
            marshall.Marshall(["Q", "w"], [inode.qid, this.msize - 24], this.replybuffer, 7);
            this.BuildReply(id, tag, 13+4);
            this.SendReply(bufchain);
            break;

        case 52: // lock
            var req = marshall.Unmarshall(["w", "b", "w", "d", "d", "w", "s"], buffer, state);
            var fid = req[0];
            var flags = req[2];
            var lock_length = req[4] === 0 ? Infinity : req[4];
            var lock_request = this.fs.DescribeLock(req[1], req[3], lock_length, req[5], req[6]);
            dbg_log("[lock] fid=" + fid +
                ", type=" + P9_LOCK_TYPES[lock_request.type] + ", start=" + lock_request.start +
                ", length=" + lock_request.length + ", proc_id=" + lock_request.proc_id);

            var ret = this.fs.Lock(this.fids[fid].inodeid, lock_request, flags);

            marshall.Marshall(["b"], [ret], this.replybuffer, 7);
            this.BuildReply(id, tag, 1);
            this.SendReply(bufchain);
            break;

        case 54: // getlock
            var req = marshall.Unmarshall(["w", "b", "d", "d", "w", "s"], buffer, state);
            var fid = req[0];
            var lock_length = req[3] === 0 ? Infinity : req[3];
            var lock_request = this.fs.DescribeLock(req[1], req[2], lock_length, req[4], req[5]);
            dbg_log("[getlock] fid=" + fid +
                ", type=" + P9_LOCK_TYPES[lock_request.type] + ", start=" + lock_request.start +
                ", length=" + lock_request.length + ", proc_id=" + lock_request.proc_id);

            var ret = this.fs.GetLock(this.fids[fid].inodeid, lock_request);

            if(!ret)
            {
                ret = lock_request;
                ret.type = P9_LOCK_TYPE_UNLCK;
            }

            var ret_length = ret.length === Infinity ? 0 : ret.length;

            size = marshall.Marshall(["b", "d", "d", "w", "s"],
                [ret.type, ret.start, ret_length, ret.proc_id, ret.client_id],
                this.replybuffer, 7);

            this.BuildReply(id, tag, size);
            this.SendReply(bufchain);
            break;

        case 24: // getattr
            var req = marshall.Unmarshall(["w", "d"], buffer, state);
            var fid = req[0];
            var inode = this.fs.GetInode(this.fids[fid].inodeid);
            dbg_log("[getattr]: fid=" + fid + " name=" + this.fids[fid].dbg_name + " request mask=" + req[1], LOG_9P);
            if(!inode || inode.status === STATUS_UNLINKED)
            {
                dbg_log("getattr: unlinked", LOG_9P);
                this.SendError(tag, "No such file or directory", ENOENT);
                this.SendReply(bufchain);
                break;
            }
            req[0] = req[1]; // request mask
            req[1] = inode.qid;

            req[2] = inode.mode;
            req[3] = inode.uid; // user id
            req[4] = inode.gid; // group id

            req[5] = inode.nlinks; // number of hard links
            req[6] = (inode.major<<8) | (inode.minor); // device id low
            req[7] = inode.size; // size low
            req[8] = this.BLOCKSIZE;
            req[9] = Math.floor(inode.size/512+1); // blk size low
            req[10] = inode.atime; // atime
            req[11] = 0x0;
            req[12] = inode.mtime; // mtime
            req[13] = 0x0;
            req[14] = inode.ctime; // ctime
            req[15] = 0x0;
            req[16] = 0x0; // btime
            req[17] = 0x0;
            req[18] = 0x0; // st_gen
            req[19] = 0x0; // data_version
            marshall.Marshall([
            "d", "Q",
            "w",
            "w", "w",
            "d", "d",
            "d", "d", "d",
            "d", "d", // atime
            "d", "d", // mtime
            "d", "d", // ctime
            "d", "d", // btime
            "d", "d",
            ], req, this.replybuffer, 7);
            this.BuildReply(id, tag, 8 + 13 + 4 + 4+ 4 + 8*15);
            this.SendReply(bufchain);
            break;

        case 26: // setattr
            var req = marshall.Unmarshall(["w", "w",
                "w", // mode
                "w", "w", // uid, gid
                "d", // size
                "d", "d", // atime
                "d", "d", // mtime
            ], buffer, state);
            var fid = req[0];
            var inode = this.fs.GetInode(this.fids[fid].inodeid);
            dbg_log("[setattr]: fid=" + fid + " request mask=" + req[1] + " name=" + this.fids[fid].dbg_name, LOG_9P);
            if(req[1] & P9_SETATTR_MODE) {
                // XXX: check mode (S_IFREG or S_IFDIR or similar should be set)
                inode.mode = req[2];
            }
            if(req[1] & P9_SETATTR_UID) {
                inode.uid = req[3];
            }
            if(req[1] & P9_SETATTR_GID) {
                inode.gid = req[4];
            }
            if(req[1] & P9_SETATTR_ATIME) {
                inode.atime = Math.floor((new Date()).getTime()/1000);
            }
            if(req[1] & P9_SETATTR_MTIME) {
                inode.mtime = Math.floor((new Date()).getTime()/1000);
            }
            if(req[1] & P9_SETATTR_CTIME) {
                inode.ctime = Math.floor((new Date()).getTime()/1000);
            }
            if(req[1] & P9_SETATTR_ATIME_SET) {
                inode.atime = req[6];
            }
            if(req[1] & P9_SETATTR_MTIME_SET) {
                inode.mtime = req[8];
            }
            if(req[1] & P9_SETATTR_SIZE) {
                await this.fs.ChangeSize(this.fids[fid].inodeid, req[5]);
            }
            this.BuildReply(id, tag, 0);
            this.SendReply(bufchain);
            break;

        case 50: // fsync
            var req = marshall.Unmarshall(["w", "d"], buffer, state);
            var fid = req[0];
            this.BuildReply(id, tag, 0);
            this.SendReply(bufchain);
            break;

        case 40: // TREADDIR
        case 116: // read
            var req = marshall.Unmarshall(["w", "d", "w"], buffer, state);
            var fid = req[0];
            var offset = req[1];
            var count = req[2];
            var inode = this.fs.GetInode(this.fids[fid].inodeid);
            if(id === 40) dbg_log("[treaddir]: fid=" + fid + " offset=" + offset + " count=" + count, LOG_9P);
            if(id === 116) dbg_log("[read]: fid=" + fid + " (" + this.fids[fid].dbg_name + ") offset=" + offset + " count=" + count + " fidtype=" + this.fids[fid].type, LOG_9P);
            if(!inode || inode.status === STATUS_UNLINKED)
            {
                dbg_log("read/treaddir: unlinked", LOG_9P);
                this.SendError(tag, "No such file or directory", ENOENT);
                this.SendReply(bufchain);
                break;
            }
            if(this.fids[fid].type === FID_XATTR) {
                if(inode.caps.length < offset+count) count = inode.caps.length - offset;
                for(var i=0; i<count; i++)
                    this.replybuffer[7+4+i] = inode.caps[offset+i];
                marshall.Marshall(["w"], [count], this.replybuffer, 7);
                this.BuildReply(id, tag, 4 + count);
                this.SendReply(bufchain);
            } else {
                this.fs.OpenInode(this.fids[fid].inodeid, undefined);
                const inodeid = this.fids[fid].inodeid;

                count = Math.min(count, this.replybuffer.length - (7 + 4));

                if(inode.size < offset+count) count = inode.size - offset;
                else if(id === 40)
                {
                    // for directories, return whole number of dir-entries.
                    count = this.fs.RoundToDirentry(inodeid, offset + count) - offset;
                }
                if(offset > inode.size)
                {
                    // offset can be greater than available - should return count of zero.
                    // See http://ericvh.github.io/9p-rfc/rfc9p2000.html#anchor30
                    count = 0;
                }

                this.bus.send("9p-read-start", [this.fids[fid].dbg_name]);

                const data = await this.fs.Read(inodeid, offset, count);

                this.bus.send("9p-read-end", [this.fids[fid].dbg_name, count]);

                if(data) {
                    this.replybuffer.set(data, 7 + 4);
                }
                marshall.Marshall(["w"], [count], this.replybuffer, 7);
                this.BuildReply(id, tag, 4 + count);
                this.SendReply(bufchain);
            }
            break;

        case 118: // write
            var req = marshall.Unmarshall(["w", "d", "w"], buffer, state);
            var fid = req[0];
            var offset = req[1];
            var count = req[2];

            const filename = this.fids[fid].dbg_name;

            dbg_log("[write]: fid=" + fid + " (" + filename + ") offset=" + offset + " count=" + count + " fidtype=" + this.fids[fid].type, LOG_9P);
            if(this.fids[fid].type === FID_XATTR)
            {
                // XXX: xattr not supported yet. Ignore write.
                this.SendError(tag, "Setxattr not supported", EOPNOTSUPP);
                this.SendReply(bufchain);
                break;
            }
            else
            {
                // XXX: Size of the subarray is unchecked
                await this.fs.Write(this.fids[fid].inodeid, offset, count, buffer.subarray(state.offset));
            }

            this.bus.send("9p-write-end", [filename, count]);

            marshall.Marshall(["w"], [count], this.replybuffer, 7);
            this.BuildReply(id, tag, 4);
            this.SendReply(bufchain);
            break;

        case 74: // RENAMEAT
            var req = marshall.Unmarshall(["w", "s", "w", "s"], buffer, state);
            var olddirfid = req[0];
            var oldname = req[1];
            var newdirfid = req[2];
            var newname = req[3];
            dbg_log("[renameat]: oldname=" + oldname + " newname=" + newname, LOG_9P);
            var ret = await this.fs.Rename(this.fids[olddirfid].inodeid, oldname, this.fids[newdirfid].inodeid, newname);
            if(ret < 0) {
                let error_message = "";
                if(ret === -ENOENT) error_message = "No such file or directory";
                else if(ret === -EPERM) error_message = "Operation not permitted";
                else if(ret === -ENOTEMPTY) error_message = "Directory not empty";
                else
                {
                    error_message = "Unknown error: " + (-ret);
                    dbg_assert(false, "[renameat]: Unexpected error code: " + (-ret));
                }
                this.SendError(tag, error_message, -ret);
                this.SendReply(bufchain);
                break;
            }
            if(TRACK_FILENAMES)
            {
                const newidx = this.fs.Search(this.fids[newdirfid].inodeid, newname);
                this.update_dbg_name(newidx, newname);
            }
            this.BuildReply(id, tag, 0);
            this.SendReply(bufchain);
            break;

        case 76: // TUNLINKAT
            var req = marshall.Unmarshall(["w", "s", "w"], buffer, state);
            var dirfd = req[0];
            var name = req[1];
            var flags = req[2];
            dbg_log("[unlink]: dirfd=" + dirfd + " name=" + name + " flags=" + flags, LOG_9P);
            var fid = this.fs.Search(this.fids[dirfd].inodeid, name);
            if(fid === -1) {
                   this.SendError(tag, "No such file or directory", ENOENT);
                   this.SendReply(bufchain);
                   break;
            }
            var ret = this.fs.Unlink(this.fids[dirfd].inodeid, name);
            if(ret < 0) {
                let error_message = "";
                if(ret === -ENOTEMPTY) error_message = "Directory not empty";
                else if(ret === -EPERM) error_message = "Operation not permitted";
                else
                {
                    error_message = "Unknown error: " + (-ret);
                    dbg_assert(false, "[unlink]: Unexpected error code: " + (-ret));
                }
                this.SendError(tag, error_message, -ret);
                this.SendReply(bufchain);
                break;
            }
            this.BuildReply(id, tag, 0);
            this.SendReply(bufchain);
            break;

        case 100: // version
            var version = marshall.Unmarshall(["w", "s"], buffer, state);
            dbg_log("[version]: msize=" + version[0] + " version=" + version[1], LOG_9P);
            if(this.msize !== version[0])
            {
                this.msize = version[0];
                this.replybuffer = new Uint8Array(Math.min(MAX_REPLYBUFFER_SIZE, this.msize*2));
            }
            size = marshall.Marshall(["w", "s"], [this.msize, this.VERSION], this.replybuffer, 7);
            this.BuildReply(id, tag, size);
            this.SendReply(bufchain);
            break;

        case 104: // attach
            // return root directorie's QID
            var req = marshall.Unmarshall(["w", "w", "s", "s", "w"], buffer, state);
            var fid = req[0];
            var uid = req[4];
            dbg_log("[attach]: fid=" + fid + " afid=" + h(req[1]) + " uname=" + req[2] + " aname=" + req[3], LOG_9P);
            this.fids[fid] = this.Createfid(0, FID_INODE, uid, "");
            var inode = this.fs.GetInode(this.fids[fid].inodeid);
            marshall.Marshall(["Q"], [inode.qid], this.replybuffer, 7);
            this.BuildReply(id, tag, 13);
            this.SendReply(bufchain);
            this.bus.send("9p-attach");
            break;

        case 108: // tflush
            var req = marshall.Unmarshall(["h"], buffer, state);
            var oldtag = req[0];
            dbg_log("[flush] " + tag, LOG_9P);
            //marshall.Marshall(["Q"], [inode.qid], this.replybuffer, 7);
            this.BuildReply(id, tag, 0);
            this.SendReply(bufchain);
            break;


        case 110: // walk
            var req = marshall.Unmarshall(["w", "w", "h"], buffer, state);
            var fid = req[0];
            var nwfid = req[1];
            var nwname = req[2];
            dbg_log("[walk]: fid=" + req[0] + " nwfid=" + req[1] + " nwname=" + nwname, LOG_9P);
            if(nwname === 0) {
                this.fids[nwfid] = this.Createfid(this.fids[fid].inodeid, FID_INODE, this.fids[fid].uid, this.fids[fid].dbg_name);
                //this.fids[nwfid].inodeid = this.fids[fid].inodeid;
                marshall.Marshall(["h"], [0], this.replybuffer, 7);
                this.BuildReply(id, tag, 2);
                this.SendReply(bufchain);
                break;
            }
            var wnames = [];
            for(var i=0; i<nwname; i++) {
                wnames.push("s");
            }
            var walk = marshall.Unmarshall(wnames, buffer, state);
            var idx = this.fids[fid].inodeid;
            var offset = 7+2;
            var nwidx = 0;
            //console.log(idx, this.fs.GetInode(idx));
            dbg_log("walk in dir " + this.fids[fid].dbg_name  + " to: " + walk.toString(), LOG_9P);
            for(var i=0; i<nwname; i++) {
                idx = this.fs.Search(idx, walk[i]);

                if(idx === -1) {
                   dbg_log("Could not find: " + walk[i], LOG_9P);
                   break;
                }
                offset += marshall.Marshall(["Q"], [this.fs.GetInode(idx).qid], this.replybuffer, offset);
                nwidx++;
                //dbg_log(this.fids[nwfid].inodeid, LOG_9P);
                //this.fids[nwfid].inodeid = idx;
                //this.fids[nwfid].type = FID_INODE;
                this.fids[nwfid] = this.Createfid(idx, FID_INODE, this.fids[fid].uid, walk[i]);
            }
            marshall.Marshall(["h"], [nwidx], this.replybuffer, 7);
            this.BuildReply(id, tag, offset-7);
            this.SendReply(bufchain);
            break;

        case 120: // clunk
            var req = marshall.Unmarshall(["w"], buffer, state);
            dbg_log("[clunk]: fid=" + req[0], LOG_9P);
            if(this.fids[req[0]] && this.fids[req[0]].inodeid >=  0) {
                await this.fs.CloseInode(this.fids[req[0]].inodeid);
                this.fids[req[0]].inodeid = -1;
                this.fids[req[0]].type = FID_NONE;
            }
            this.BuildReply(id, tag, 0);
            this.SendReply(bufchain);
            break;

        case 32: // txattrcreate
            var req = marshall.Unmarshall(["w", "s", "d", "w"], buffer, state);
            var fid = req[0];
            var name = req[1];
            var attr_size = req[2];
            var flags = req[3];
            dbg_log("[txattrcreate]: fid=" + fid + " name=" + name + " attr_size=" + attr_size + " flags=" + flags, LOG_9P);

            // XXX: xattr not supported yet. E.g. checks corresponding to the flags needed.
            this.fids[fid].type = FID_XATTR;

            this.BuildReply(id, tag, 0);
            this.SendReply(bufchain);
            //this.SendError(tag, "Operation i not supported",  EINVAL);
            //this.SendReply(bufchain);
            break;

        case 30: // xattrwalk
            var req = marshall.Unmarshall(["w", "w", "s"], buffer, state);
            var fid = req[0];
            var newfid = req[1];
            var name = req[2];
            dbg_log("[xattrwalk]: fid=" + req[0] + " newfid=" + req[1] + " name=" + req[2], LOG_9P);

            // Workaround for Linux restarts writes until full blocksize
            this.SendError(tag, "Setxattr not supported", EOPNOTSUPP);
            this.SendReply(bufchain);
            /*
            this.fids[newfid] = this.Createfid(this.fids[fid].inodeid, FID_NONE, this.fids[fid].uid, this.fids[fid].dbg_name);
            //this.fids[newfid].inodeid = this.fids[fid].inodeid;
            //this.fids[newfid].type = FID_NONE;
            var length = 0;
            if (name === "security.capability") {
                length = this.fs.PrepareCAPs(this.fids[fid].inodeid);
                this.fids[newfid].type = FID_XATTR;
            }
            marshall.Marshall(["d"], [length], this.replybuffer, 7);
            this.BuildReply(id, tag, 8);
            this.SendReply(bufchain);
            */
            break;

        default:
            dbg_log("Error in Virtio9p: Unknown id " + id + " received", LOG_9P);
            dbg_assert(false);
            //this.SendError(tag, "Operation i not supported",  EOPNOTSUPP);
            //this.SendReply(bufchain);
            break;
    }

    //consistency checks if there are problems with the filesystem
    //this.fs.Check();
};


// ---- File: lib/marshall.js ----
// -------------------------------------------------
// ------------------ Marshall ---------------------
// -------------------------------------------------
// helper functions for virtio and 9p.



const textde = new TextDecoder();
const texten = new TextEncoder();

// Inserts data from an array to a byte aligned struct in memory
function Marshall(typelist, input, struct, offset) {
    var item;
    var size = 0;
    for(var i=0; i < typelist.length; i++) {
        item = input[i];
        switch(typelist[i]) {
            case "w":
                struct[offset++] = item & 0xFF;
                struct[offset++] = (item >> 8) & 0xFF;
                struct[offset++] = (item >> 16) & 0xFF;
                struct[offset++] = (item >> 24) & 0xFF;
                size += 4;
                break;
            case "d": // double word
                struct[offset++] = item & 0xFF;
                struct[offset++] = (item >> 8) & 0xFF;
                struct[offset++] = (item >> 16) & 0xFF;
                struct[offset++] = (item >> 24) & 0xFF;
                struct[offset++] = 0x0;
                struct[offset++] = 0x0;
                struct[offset++] = 0x0;
                struct[offset++] = 0x0;
                size += 8;
                break;
            case "h":
                struct[offset++] = item & 0xFF;
                struct[offset++] = item >> 8;
                size += 2;
                break;
            case "b":
                struct[offset++] = item;
                size += 1;
                break;
            case "s":
                var lengthoffset = offset;
                var length = 0;
                struct[offset++] = 0; // set the length later
                struct[offset++] = 0;
                size += 2;

                var stringBytes = texten.encode(item);
                size += stringBytes.byteLength;
                length += stringBytes.byteLength;
                struct.set(stringBytes, offset);
                offset += stringBytes.byteLength;

                struct[lengthoffset+0] = length & 0xFF;
                struct[lengthoffset+1] = (length >> 8) & 0xFF;
                break;
            case "Q":
                Marshall(["b", "w", "d"], [item.type, item.version, item.path], struct, offset);
                offset += 13;
                size += 13;
                break;
            default:
                dbg_log("Marshall: Unknown type=" + typelist[i]);
                break;
        }
    }
    return size;
}


// Extracts data from a byte aligned struct in memory to an array
function Unmarshall(typelist, struct, state) {
    let offset = state.offset;
    var output = [];
    for(var i=0; i < typelist.length; i++) {
        switch(typelist[i]) {
            case "w":
                var val = struct[offset++];
                val += struct[offset++] << 8;
                val += struct[offset++] << 16;
                val += (struct[offset++] << 24) >>> 0;
                output.push(val);
                break;
            case "d":
                var val = struct[offset++];
                val += struct[offset++] << 8;
                val += struct[offset++] << 16;
                val += (struct[offset++] << 24) >>> 0;
                offset += 4;
                output.push(val);
                break;
            case "h":
                var val = struct[offset++];
                output.push(val + (struct[offset++] << 8));
                break;
            case "b":
                output.push(struct[offset++]);
                break;
            case "s":
                var len = struct[offset++];
                len += struct[offset++] << 8;

                var stringBytes = struct.slice(offset, offset + len);
                offset += len;
                output.push(textde.decode(stringBytes));
                break;
            case "Q":
                state.offset = offset;
                const qid = Unmarshall(["b", "w", "d"], struct, state);
                offset = state.offset;
                output.push({
                    type: qid[0],
                    version: qid[1],
                    path: qid[2],
                });
                break;
            default:
                dbg_log("Error in Unmarshall: Unknown type=" + typelist[i]);
                break;
        }
    }
    state.offset = offset;
    return output;
}

