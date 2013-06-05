<?php
/** Makes the browser remember all images.
 * 
 * This file is automatically called when an image is beeing loaded.
 * This file does not use the core, because that would be a huge overhead.
 * 
 * @author YAY!Scripting
 * @package com
 * @subpackage loading
 */

// set correct working directory
chdir('../../');

// both variables set?
if (empty($_GET['file']) || empty($_GET['ext']))
	throwError();

// strip dir
$file = $_GET['file'];
$ext  = strtolower($_GET['ext']);
$dir = '';

// get dirs
while (strpos($file, '/') !== false) {
	
	$pos = strpos($file, '/');
	
	if (strpos(substr($file, 0, $pos + 1), '.') !== false)
		throwError();	
	
	$dir .= substr($file, 0, $pos + 1);
	$file = substr($file, $pos + 1);
	
}		
	
		
// check extension
$exts = array('png', 'jpg', 'jpeg', 'gif', 'bmp', 'ico');
if (!in_array($ext, $exts))
	throwError();
	
// file exists?
if (!file_exists($dir.$file.'.'.$ext))
	throwError();
	

// load MIMES
$mime = array (
	'png'  => 'image/png',
	'jpg'  => 'image/jpeg',
	'jpeg' => 'image/jpeg',
	'gif'  => 'image/gif',
	'bmp'  => 'image/bmp',
	'ico'  => 'image/x-icon'
);

// get etag
$etag		    = sha1($content);
$last_modified_time = filemtime($dir.$file.'.'.$ext); 

// headers
header('Content-Disposition: inline; filename="'.$file . '.' . $ext.'"');
header("Content-type: ".$mime[$ext]);
header("Cache-control: max-age");
header("Expires: ".gmdate("r", strtotime("+1 year")));
header("ETag: ".$etag);
header("Last-Modified: ".gmdate("r", $last_modified_time));


// exit if not modified
if (@strtotime($_SERVER['HTTP_IF_MODIFIED_SINCE']) == $last_modified_time || @trim($_SERVER['HTTP_IF_NONE_MATCH']) == $etag) {

	header("HTTP/1.1 304 Not Modified"); 
	exit; 
    
}

// read file
readfile($dir.$file.'.'.$ext);

/** Loads the error-page (404)
 * 
 * @ignore
 */
function throwError()
{
	
	$_GET['ys_route'] = 'error/trigger_404';
	include 'index.php';
	
}