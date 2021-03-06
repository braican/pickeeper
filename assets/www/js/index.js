/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    }
};

(function(PIC, $, undefined){

    var jQT = new $.jQTouch({
        icon: 'jqtouch.png',
        icon4: 'jqtouch4.png',
        addGlossToIcon: false,
        startupScreen: 'jqt_startup.png',
        statusBar: 'black-translucent',
        preloadImages: []
    });

    var _DATA = {},
        new_data,
        activeList;

    document.addEventListener("deviceready", onDeviceReady, false);

    // device APIs are available
    //
    function onDeviceReady() {
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, gotFS, fail);
    }

    function gotFS(fileSystem) {
        fileSystem.root.getDirectory("PicKeeper", {create: true, exclusive: false}, gotDirEntry, fail);
    }

    function gotDirEntry(parent){
        var parentEntry = new DirectoryEntry(parent.name, parent.fullPath);
        parentEntry.getFile("data.txt", {create: true, exclusive: false}, gotFileEntry, fail);
    }

    function gotFileEntry(fileEntry) {
        fileEntry.file(gotFile, fail);
        // fileEntry.createWriter(gotFileWriter, fail);
    }

    function gotFile(file){
        readAsText(file);
    }

    function readAsText(file){
        var reader = new FileReader();
        reader.onloadend = function(evt){
            
            var json = JSON.parse(evt.target.result)
            _DATA = json;

            refreshLists(_DATA);

            PIC.init();
        }

        reader.readAsText(file);
    }

    //
    // write the file
    //
    function writeTheData() {
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, gotFStoWrite, fail);
    }

    function gotFStoWrite(fileSystem) {
        fileSystem.root.getDirectory("PicKeeper", {create: true, exclusive: false}, gotDirEntrytoWrite, fail);
    }

    function gotDirEntrytoWrite(parent){
        var parentEntry = new DirectoryEntry(parent.name, parent.fullPath);
        parentEntry.getFile("data.txt", {create: true, exclusive: false}, gotFileEntrytoWrite, fail);
    }

    function gotFileEntrytoWrite(fileEntry) {
        fileEntry.createWriter(gotFileWriter, fail);
    }

    function gotFileWriter(writer) {
        console.log("GOT FILE WRITER");
        writer.onwriteend = function(evt) {
            console.log("finished with write");
        };
        writer.write(new_data);
    }

    function fail(error) {
        console.log(error.code);
    }

    //
    // refreshLists
    //
    // @param - data (obj) - the data object
    //
    function refreshLists(data){
        $('#lists ul').empty();
        $.each(data, function(index, val) {
            var html = '<li><a href="#items" data-list="' + index + '">' + index + '</a></li>';
            $('#lists ul').append(html);
        });
    }

    //
    // refreshItems
    //
    // @param - list (array) - the list of object to render
    //
    function refreshItems(list){
        $('#items ul').empty();

        $.each(list, function(index, val) {
            var html =  '<li>' +
                            '<a href="#detail" data-pic="' + val["pic"] + '" data-name="' + val["name"] + '" data-date="' + val["date"] + '">' + 
                                '<span class="name">' + val["name"] + '</span> ' +
                                '<span class="date">' + val["date"] + '</span>' +
                            '</a>' +
                        '</li>';
            $('#items ul').append(html);
        });
    }

    // =====================
    // PUBLIC FUNCTIONS
    // =====================

    PIC.init = function(){

        // ----------------------
        // render content

        //
        // create the lists
        //
        $('#lists').on('click', 'ul li a', function(){
            var listName = $(this).data('list');

            activeList = listName;
            
            $('#items h1, #detail h1').text(listName);

            refreshItems(_DATA[listName]);
        });
        
        //
        // show the detail
        //
        $('#items').on('click', 'ul li a', function(event){
            event.preventDefault();
            var itemName = $(this).data('name'),
                itemDate = $(this).data('date'),
                itemPic = $(this).data('pic');

            $('#detail h2').text(itemName);
            $('#detail h3').text(itemDate);
            $('#detail img').attr('src', itemPic);
        });

        // -------------------------------
        // add the things
        //
        //
        // add new list
        //
        $('#add-list button').on('click', function(event){
            event.preventDefault();
            event.stopPropagation();
            var listName = $('#add-list input[name="list-name"]').val();

            _DATA[listName] = [];

            new_data = _DATA;

            writeTheData();

            refreshLists(_DATA);

            jQT.goBack();

            $('input[type="text"]', this).val('');
        });

        //
        // add new item
        //
        $('#add-item button').on('click', function(event){
            event.preventDefault();
            var itemName = $('#add-item input[name="item-name"]').val(),
                itemDate = $('#add-item input[name="item-date"]').val(),
                tmpObj = {};

            tmpObj["name"] = itemName;
            tmpObj["date"] = itemDate;
            tmpObj["pic"] = "img/img.gif";

            _DATA[activeList].push(tmpObj);

            new_data = _DATA;

            writeTheData();

            refreshItems(_DATA[activeList]);

            jQT.goBack();
            $('input[type="text"], input[type="date"]', this).val('');

        });

    }

    //
    // DOM READY
    //
    // $(document).ready(function() {
        
    //     $.get('data.txt', function(data) {
    //         var json = JSON.parse(data);

    //         _DATA = json;
    //         console.log(json);

    //         refreshLists(_DATA);

    //         PIC.init();

    //     }, 'json');

    // });

})(window.PIC = window.PIC || {}, Zepto);
