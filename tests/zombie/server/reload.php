<?php
	$datafile = "../data/data";
	@unlink($datafile);

	$watchfile = "../data/watch";
	$f = fopen($watchfile, "w");
	fwrite($f, rand(0, 1000));
	fclose($f);
?>
